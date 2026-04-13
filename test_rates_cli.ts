import { getDatabaseAdapter } from './src/db';
import { MorphoScanner } from './src/protocols/morpho';
import { AaveScanner } from './src/protocols/aave';
import { MakerScanner } from './src/protocols/maker';
import { LiquityV2Scanner } from './src/protocols/liquityV2';

async function test() {
  const db = await getDatabaseAdapter();
  const scanners = [
    new MorphoScanner(db),
    new AaveScanner(db),
    new MakerScanner(db),
    new LiquityV2Scanner(db),
  ];

  const pairs = [
    { coll: 'ETH', debt: 'DAI', collAddr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', debtAddr: '0x6B175474E89094C44Da98B954EedeAC495271d0F' },
    { coll: 'ETH', debt: 'USDC', collAddr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', debtAddr: '0xA0b86991c6218b36c1d19D4a2e9eb0cE3606eb48' },
    { coll: 'wstETH', debt: 'USDS', collAddr: '0x7f39C581F595B53c5cb19bD0b3f8DA6c935E2Ca0', debtAddr: '0xdC035D45d973E3EC169d2276DDab16f1e407384F' },
  ];

  for (const scanner of scanners) {
    console.log(`\nTesting ${scanner.getName()}...`);
    for (const pair of pairs) {
      let marketId = null;
      if (scanner.getName() === 'MorphoBlue') {
        if (pair.coll === 'ETH' && pair.debt === 'DAI') marketId = '0xc54dca13511eb495536417730e2f5053e160e908cb831f4a97410c9d749629b0';
        if (pair.coll === 'wstETH' && pair.debt === 'USDS') marketId = '0xb374528d44b6ab6e0cecc87e0481f45d892f38baec90c1d318851969ec14ea5f';
      } else if (scanner.getName() === 'MakerMCD') {
        if (pair.coll === 'ETH' && pair.debt === 'DAI') marketId = 'ETH-A';
      } else if (scanner.getName() === 'LiquityV2') {
        if (pair.coll === 'ETH' && pair.debt === 'BOLD') marketId = '0x7B9A4716F8C9516622370A31D08f906a20760C58';
      }

      try {
        console.log(`Checking ${pair.coll}/${pair.debt} (marketId: ${marketId})...`);
        const rate = await (scanner as any).getMarketRate(pair.collAddr, pair.debtAddr, marketId || undefined);
        console.log(`Result: ${rate !== null ? (rate * 100).toFixed(2) + '%' : 'NULL'}`);
      } catch (e: any) {
        console.error(`Error in ${scanner.getName()}:`, e);
      }
    }
  }
}

test().catch(console.error);
