import express from 'express';
import cors from 'cors';
import { getDatabaseAdapter } from './db/index.js';
import { RiskService, PROTOCOL_THRESHOLDS } from './utils/risk.js';
import { syncAllRates } from './scripts/sync_rates.js';
import { VolatilityPredictor } from './utils/volatility.js';
import { syncVolatility } from './scripts/sync_volatility.js';

const app = express();
const port = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'https://borrowdesk.org',
  'http://borrowdesk.org',
  'https://gbufr.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

let riskService: RiskService;
let volatilityPredictor: VolatilityPredictor;

app.get('/api/volatility/latest', async (req, res) => {
  const { symbol } = req.query;
  const db = await getDatabaseAdapter();
  
  try {
    if (symbol) {
      const prediction = await db.getLatestVolatilityPrediction((symbol as string).toUpperCase());
      return res.json(prediction);
    }
    
    // Return all if no symbol specified
    const symbols = ['BTC', 'ETH'];
    const results = await Promise.all(symbols.map(s => db.getLatestVolatilityPrediction(s)));
    res.json(results.filter(r => r !== null));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/volatility/predict', async (req, res) => {
  const { symbol = 'BTC' } = req.query;
  const assetSymbol = (symbol as string).toUpperCase();
  const db = await getDatabaseAdapter();

  console.log(`[API] Prediction requested for ${assetSymbol}`);
  
  try {
    // 1. Try to get from DB first
    const existing = await db.getLatestVolatilityPrediction(assetSymbol);
    const STALE_THRESHOLD_MS = 65 * 60 * 1000; // 65 minutes
    
    if (existing && (Date.now() - existing.timestamp) < STALE_THRESHOLD_MS) {
      console.log(`[API] Returning cached prediction for ${assetSymbol}`);
      return res.json(existing);
    }

    // 2. Fallback to on-demand if stale or missing (optional, but good for UX)
    console.log(`[API] Cache stale or missing for ${assetSymbol}. Fetching on-demand...`);
    const klines = await volatilityPredictor.fetchLatestKlines(assetSymbol);
    const prediction30m = await volatilityPredictor.predict(assetSymbol, klines);
    const latestPrice = klines[klines.length - 1].close;
    
    const daily = VolatilityPredictor.scaleVolatility(prediction30m, 'daily');
    const ann = VolatilityPredictor.scaleVolatility(prediction30m, 'ann');
    
    const result = {
      symbol: assetSymbol,
      timestamp: Date.now(),
      price: latestPrice,
      prediction_30m: prediction30m,
      prediction_daily: daily,
      prediction_ann: ann
    };

    // Save to DB so next call is fast
    await db.upsertVolatilityPrediction(result);
    
    res.json(result);
  } catch (e: any) {
    console.error(`[API] Prediction failed for ${assetSymbol}:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/positions', async (req, res) => {
  const { protocol, atRisk, inefficient, debtToken, collateralAsset, chain, limit = 50 } = req.query;
  const db = await getDatabaseAdapter();
  let positions = await db.getAllPositions();

  let results = positions.map(p => {
    const hf = riskService.calculateHealthFactor(p);
    const collateralPrice = riskService.getPriceForAsset(p.collateralAsset, p.collateralSymbol);
    const debtPrice = riskService.getPriceForAsset(p.debtAsset, p.debtSymbol);
    
    const collAmount = Number(p.collateralAmount) / Math.pow(10, p.collateralDecimals);
    const debtAmount = Number(p.debtAmount) / Math.pow(10, p.debtDecimals);
    
    const collUSD = collAmount * collateralPrice;
    const debtUSD = debtAmount * debtPrice;
    
    const currentLTV = collUSD > 0 ? debtUSD / collUSD : 0;
    const threshold = PROTOCOL_THRESHOLDS[p.protocol] || 0.8;
    
    // LiqPrice = debtUSD / (collAmount * threshold)
    const liqPrice = collAmount > 0 ? (debtUSD / (collAmount * threshold)) : 0;

    return {
      ...p,
      collateralAmount: collAmount.toString(),
      debtAmount: debtAmount.toString(),
      healthFactor: hf,
      collateralPrice,
      debtPrice,
      collateralUSD: collUSD,
      debtUSD,
      currentLTV,
      liquidationThreshold: threshold,
      liquidationPrice: liqPrice,
      isInefficient: hf > 3.0,
      chain: p.chain,
    };
  });

  if (protocol) {
    results = results.filter(p => p.protocol.toLowerCase() === (protocol as string).toLowerCase());
  }
  if (atRisk === 'true') {
    results = results.filter(p => p.healthFactor < 1.1);
  }
  if (inefficient === 'true') {
    results = results.filter(p => p.isInefficient);
  }
  if (debtToken && debtToken !== 'All') {
    results = results.filter(p => p.debtSymbol.toLowerCase() === (debtToken as string).toLowerCase());
  }

  if (collateralAsset && collateralAsset !== 'All') {
    results = results.filter(p => p.collateralSymbol.toLowerCase() === (collateralAsset as string).toLowerCase());
  }

  if (chain && chain !== 'All') {
    results = results.filter(p => p.chain.toLowerCase() === (chain as string).toLowerCase());
  }

  results.sort((a, b) => a.healthFactor - b.healthFactor);
  res.json(results.slice(0, Number(limit)));
});

app.get('/api/rates', async (req, res) => {
  const { debtToken, protocol, chain, collateralAsset } = req.query;
  const db = await getDatabaseAdapter();
  let rates = await db.getAllRates();
  
  if (debtToken && debtToken !== 'All') {
    rates = rates.filter(r => r.debtSymbol.toLowerCase() === (debtToken as string).toLowerCase());
  }

  if (collateralAsset && collateralAsset !== 'All') {
    rates = rates.filter(r => r.collateralSymbol.toLowerCase() === (collateralAsset as string).toLowerCase());
  }

  if (protocol && protocol !== 'All') {
    rates = rates.filter(r => r.protocol.toLowerCase() === (protocol as string).toLowerCase());
  }

  if (chain && chain !== 'All') {
    rates = rates.filter(r => r.chain.toLowerCase() === (chain as string).toLowerCase());
  }
  
  res.json(rates);
});

app.get('/api/prices', (req, res) => {
  res.json(riskService['priceCache']); 
});

import { GCSStorage } from './utils/gcs.js';

async function start() {
  // Restore DB from cloud storage in production
  if (process.env.NODE_ENV === 'production') {
    await GCSStorage.restore();
  }

  const db = await getDatabaseAdapter();
  riskService = new RiskService(db);
  volatilityPredictor = new VolatilityPredictor(); 
  
  await riskService.syncPricesFromDb();

  // 1. Rate Sync Loop (24 hour interval)
  const runRateSync = async () => {
    const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
    while (true) {
      const latestRateTime = await db.getLatestRateTimestamp();
      const now = Math.floor(Date.now() / 1000);
      const timeSinceLastSync = now - latestRateTime;
      const waitTimeMs = Math.max(0, SYNC_INTERVAL_MS - (timeSinceLastSync * 1000));

      if (waitTimeMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTimeMs));
      }

      console.log('[API] Starting background interest rate sync...');
      try {
        await syncAllRates(db);
        if (process.env.NODE_ENV === 'production') await GCSStorage.backup();
      } catch (e) {
        console.error('[API] Background interest rate sync failed:', e);
      }
      await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL_MS));
    }
  };

  // 2. Volatility Sync Loop (1 hour interval)
  const runVolatilitySync = async () => {
    const VOL_INTERVAL_MS = 60 * 60 * 1000;
    while (true) {
      console.log('[API] Starting background volatility sync...');
      try {
        await syncVolatility();
      } catch (e) {
        console.error('[API] Background volatility sync failed:', e);
      }
      await new Promise(resolve => setTimeout(resolve, VOL_INTERVAL_MS));
    }
  };

  runRateSync().catch(console.error);
  runVolatilitySync().catch(console.error);

  setInterval(async () => {
    try {
      await riskService.syncPricesFromDb();
    } catch (e) {
      console.error('Failed to sync prices in background:', e);
    }
  }, 1000);

  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      console.log('[API] Checking for database updates in GCS...');
      try {
        await GCSStorage.restore();
      } catch (e) {
        console.error('[API] Failed to pull database from GCS:', e);
      }
    }, 24 * 60 * 60 * 1000);
  }

  app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
  });
}

start().catch(console.error);
 
 
 
 
 
 
 
 
