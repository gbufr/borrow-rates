import { getDatabaseAdapter } from '../db';
import { SyncOrchestrator } from '../utils/SyncOrchestrator';
import { MorphoScanner } from '../protocols/morpho';
import { AaveScanner } from '../protocols/aave';
import { LiquityScanner } from '../protocols/liquity';
import { LiquityV2Scanner } from '../protocols/liquityV2';
import { SkyScanner } from '../protocols/sky';
import { MakerScanner } from '../protocols/maker';
import { RiskService } from '../utils/risk';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const db = await getDatabaseAdapter();
  const riskService = new RiskService(db);

  const scanners = [
    new MorphoScanner(db),
    new AaveScanner(db),
    new LiquityScanner(db),
    new LiquityV2Scanner(db),
    new SkyScanner(db),
    new MakerScanner(db),
  ];

  const orchestrator = new SyncOrchestrator({
    protocols: scanners,
    db: db,
    pollIntervalMs: 60 * 60 * 1000, // 1 hour by default
    concurrencyLimit: 2,
  });

  const args = process.argv.slice(2);
  const isBackfill = args.includes('--backfill');
  const protocolFilter = args.find(a => a.startsWith('--protocol='))?.split('=')[1];
  const fromBlockArg = args.find(a => a.startsWith('--from='))?.split('=')[1];

  console.log('--- Liquidax Loan Sync System ---');
  
  // Always fetch latest prices before starting
  console.log('Fetching latest prices...');
  await riskService.fetchPrices();

  if (isBackfill) {
    const fromBlock = fromBlockArg ? BigInt(fromBlockArg) : undefined;
    console.log(`Starting backfill ${protocolFilter ? `for ${protocolFilter}` : 'for all protocols'}...`);
    await orchestrator.backfill(protocolFilter, fromBlock);
    console.log('Backfill completed.');
  } else {
    console.log('Starting periodic sync daemon...');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      orchestrator.stop();
      process.exit(0);
    });

    await orchestrator.start();
  }
}

main().catch(error => {
  console.error('Fatal error in sync script:', error);
  process.exit(1);
});
