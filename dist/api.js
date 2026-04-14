import express from 'express';
import cors from 'cors';
import { getDatabaseAdapter } from './db/index.js';
import { RiskService, PROTOCOL_THRESHOLDS } from './utils/risk.js';
import { syncAllRates } from './scripts/sync_rates.js';
const app = express();
const port = process.env.PORT || 3001;
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://borrowdesk.org',
    'http://borrowdesk.org'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());
let riskService;
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
        results = results.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (atRisk === 'true') {
        results = results.filter(p => p.healthFactor < 1.1);
    }
    if (inefficient === 'true') {
        results = results.filter(p => p.isInefficient);
    }
    if (debtToken && debtToken !== 'All') {
        results = results.filter(p => p.debtSymbol.toLowerCase() === debtToken.toLowerCase());
    }
    if (collateralAsset && collateralAsset !== 'All') {
        results = results.filter(p => p.collateralSymbol.toLowerCase() === collateralAsset.toLowerCase());
    }
    if (chain && chain !== 'All') {
        results = results.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }
    results.sort((a, b) => a.healthFactor - b.healthFactor);
    res.json(results.slice(0, Number(limit)));
});
app.get('/api/rates', async (req, res) => {
    const { debtToken, protocol, chain, collateralAsset } = req.query;
    const db = await getDatabaseAdapter();
    let rates = await db.getAllRates();
    if (debtToken && debtToken !== 'All') {
        rates = rates.filter(r => r.debtSymbol.toLowerCase() === debtToken.toLowerCase());
    }
    if (collateralAsset && collateralAsset !== 'All') {
        rates = rates.filter(r => r.collateralSymbol.toLowerCase() === collateralAsset.toLowerCase());
    }
    if (protocol && protocol !== 'All') {
        rates = rates.filter(r => r.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (chain && chain !== 'All') {
        rates = rates.filter(r => r.chain.toLowerCase() === chain.toLowerCase());
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
    await riskService.syncPricesFromDb();
    // Background Rate Sync (every 1 hour)
    setInterval(async () => {
        console.log('[API] Starting background interest rate sync...');
        try {
            await syncAllRates(db);
            console.log('[API] Background interest rate sync completed.');
        }
        catch (e) {
            console.error('[API] Background interest rate sync failed:', e);
        }
    }, 60 * 60 * 1000);
    // Initial sync on startup
    syncAllRates(db).catch((e) => console.error('[API] Initial rate sync failed:', e.message));
    setInterval(async () => {
        try {
            await riskService.syncPricesFromDb();
        }
        catch (e) {
            console.error('Failed to sync prices in background:', e);
        }
    }, 60000);
    // Periodic GCS pull (every 30 minutes) to keep up with background sync
    if (process.env.NODE_ENV === 'production') {
        setInterval(async () => {
            console.log('[API] Checking for database updates in GCS...');
            try {
                await GCSStorage.restore();
            }
            catch (e) {
                console.error('[API] Failed to pull database from GCS:', e);
            }
        }, 30 * 60 * 1000);
    }
    app.listen(port, () => {
        console.log(`API Server running at http://localhost:${port}`);
    });
}
start().catch(console.error);
