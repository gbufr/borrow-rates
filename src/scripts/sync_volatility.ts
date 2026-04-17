import { getDatabaseAdapter } from '../db/index.js';
import { VolatilityPredictor } from '../utils/volatility.js';
import dotenv from 'dotenv';

dotenv.config();

async function syncVolatility() {
  const db = await getDatabaseAdapter();
  const predictor = new VolatilityPredictor();
  const symbols = ['BTC', 'ETH'];

  console.log(`[Sync Volatility] Starting sync for ${symbols.join(', ')}...`);

  for (const symbol of symbols) {
    try {
      console.log(`[Sync Volatility] Processing ${symbol}...`);
      
      // 1. Fetch latest klines (33 days for buffer)
      const klines = await predictor.fetchLatestKlines(symbol);
      const latestPrice = klines[klines.length - 1].close;
      const latestTimestamp = klines[klines.length - 1].timestamp;

      // 2. Predict volatility
      const prediction30m = await predictor.predict(symbol, klines);
      const daily = VolatilityPredictor.scaleVolatility(prediction30m, 'daily');
      const ann = VolatilityPredictor.scaleVolatility(prediction30m, 'ann');

      // 3. Store in DB
      await db.upsertVolatilityPrediction({
        symbol,
        timestamp: latestTimestamp,
        price: latestPrice,
        prediction_30m: prediction30m,
        prediction_daily: daily,
        prediction_ann: ann
      });

      console.log(`[Sync Volatility] Saved prediction for ${symbol}: Price $${latestPrice.toFixed(2)}, Daily Vol ${(daily * 100).toFixed(2)}%`);
    } catch (e) {
      console.error(`[Sync Volatility] Failed for ${symbol}:`, e);
    }
  }

  await db.close();
  console.log('[Sync Volatility] Sync finished.');
}

// Run if called directly
const isMain = import.meta.url.endsWith(process.argv[1]);
if (isMain || process.argv.includes('--run')) {
  syncVolatility().catch(console.error);
}

export { syncVolatility };
