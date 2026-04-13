import { getDatabaseAdapter } from './db';
import { MorphoScanner } from './protocols/morpho';
import { AaveScanner } from './protocols/aave';
import { MakerScanner } from './protocols/maker';
import { LiquityScanner } from './protocols/liquity';
import { LiquityV2Scanner } from './protocols/liquityV2';
import { SkyScanner } from './protocols/sky';

async function verify() {
  const db = await getDatabaseAdapter();
  const scanners = [
    new MorphoScanner(db),
    new AaveScanner(db),
    new MakerScanner(db),
    new LiquityScanner(db),
    new LiquityV2Scanner(db),
    new SkyScanner(db),
  ];

  console.log('--- Verifying Live Data Fetching ---');
  for (const scanner of scanners) {
    try {
      console.log(`\nProtocol: ${scanner.getName()}`);
      // @ts-ignore - Some scanners may not implement this
      const stats = await (scanner as any).getGlobalStats?.();
      if (stats) {
        console.log(`Global Stats: TVL $${(stats.tvl / 1e6).toFixed(2)}M, Borrowed $${(stats.totalBorrowed / 1e6).toFixed(2)}M`);
      }
      
      const rate = await scanner.getMarketRate('0x...', '0x...', 'ETH-A');
      console.log(`Market Rate: ${rate}`);
    } catch (e) {
      console.error(`Failed to verify ${scanner.getName()}:`, e);
    }
  }
  await db.close();
}

verify().catch(console.error);
