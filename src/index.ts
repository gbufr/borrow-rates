import { getDatabaseAdapter } from './db/index.js';
import { MorphoScanner } from './protocols/morpho.js';
import { AaveScanner } from './protocols/aave.js';
import { LiquityScanner } from './protocols/liquity.js';
import { LiquityV2Scanner } from './protocols/liquityV2.js';
import { SkyScanner } from './protocols/sky.js';
import { MakerScanner } from './protocols/maker.js';
import { ProtocolScanner } from './utils/types.js';
import { RiskService } from './utils/risk.js';
import { syncAllRates } from './scripts/sync_rates.js';
import { fileURLToPath } from 'url';

async function main() {
  const db = await getDatabaseAdapter();
  const scanners: ProtocolScanner[] = [
    new MorphoScanner(db),
    new AaveScanner(db),
    new LiquityScanner(db),
    new LiquityV2Scanner(db),
    new SkyScanner(db),
    new MakerScanner(db),
  ];

  const args = process.argv.slice(2);
  const isGlobal = args.includes('--global');
  const isIncremental = args.includes('--incremental');
  const showResults = args.includes('--results');

  const riskService = new RiskService(db);

  if (showResults) {
    for (const scanner of scanners) {
      const positions = await db.getPositionsByProtocol(scanner.getName());
      console.log(`\n--- ${scanner.getName()} Positions (${positions.length}) ---`);
      if (positions.length > 0) {
        console.table(positions.slice(0, 10).map(p => ({
          user: p.userAddress.slice(0, 10) + '...',
          collateral: p.collateralAmount,
          debt: p.debtAmount,
          health: p.healthFactor || 'N/A'
        })));
      }
    }
    await db.close();
    return;
  }

  const syncRates = async () => {
    await syncAllRates();
  };

  if (isGlobal || isIncremental) {
    console.log(`Starting ${isGlobal ? 'global' : 'incremental'} scan...`);
    await riskService.fetchPrices();
    await syncRates();

    for (const scanner of scanners) {
      try {
        console.log(`Scanning protocol: ${scanner.getName()}...`);
        if (isGlobal) await scanner.scanGlobal();
        else await scanner.scanIncremental();
      } catch (e) {
        console.error(`Error scanning ${scanner.getName()}:`, e);
      }
    }
  } else {
    console.log('Please specify --global or --incremental or --results');
  }

  await db.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
