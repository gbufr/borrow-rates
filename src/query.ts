import { getDatabaseAdapter } from './db';
import { formatUnits } from 'viem';
import minimist from 'minimist';
import { RiskService } from './utils/risk';

async function main() {
  const args = minimist(process.argv.slice(2));
  const db = await getDatabaseAdapter();
  const risk = new RiskService();

  const protocol = args.protocol || args.p;
  const user = args.user || args.u;
  const minDebt = args['min-debt'] || 0;
  const showAtRisk = args['at-risk'] || false;
  const limit = args.limit || 50;

  console.log('--- Querying Loan Data (Risk Dashboard) ---');
  if (protocol) console.log(`Filter Protocol: ${protocol}`);
  if (user) console.log(`Filter User: ${user}`);
  if (showAtRisk) console.log(`Filter: Show At-Risk Only (HF < 1.1)`);

  await risk.fetchPrices();

  let positions = await db.getAllPositions();

  // Enriched positions with HF
  const enriched = positions.map(p => {
    const hf = risk.calculateHealthFactor(p);
    return { ...p, calculatedHF: hf };
  });

  let filtered = enriched;
  if (protocol) {
    filtered = filtered.filter((p: any) => p.protocol.toLowerCase() === protocol.toLowerCase());
  }
  if (user) {
    filtered = filtered.filter((p: any) => p.userAddress.toLowerCase() === user.toLowerCase());
  }
  if (minDebt > 0) {
    filtered = filtered.filter((p: any) => parseFloat(p.debtAmount) >= minDebt);
  }
  if (showAtRisk) {
    filtered = filtered.filter((p: any) => p.calculatedHF < 1.1);
  }

  // Slice results
  const results = filtered.slice(0, limit);

  if (results.length === 0) {
    console.log('No positions found matching your criteria.');
    return;
  }

  console.table(results.map(p => {
    const collSymbol = risk.getSymbolForAsset(p.collateralAsset);
    const debtSymbol = risk.getSymbolForAsset(p.debtAsset);
    const collPrice = risk.getPriceForAsset(p.collateralAsset);
    const debtPrice = risk.getPriceForAsset(p.debtAsset);

    return {
      protocol: p.protocol,
      user: `${p.userAddress.slice(0, 6)}...${p.userAddress.slice(-4)}`,
      collateral: `${(Number(p.collateralAmount) / Math.pow(10, p.collateralDecimals)).toFixed(2)} ${collSymbol} ($${collPrice.toFixed(2)})`,
      debt: `${(Number(p.debtAmount) / Math.pow(10, p.debtDecimals)).toFixed(2)} ${debtSymbol} ($${debtPrice.toFixed(2)})`,
      hf: p.calculatedHF === Infinity ? '∞' : p.calculatedHF.toFixed(3),
      status: p.calculatedHF < 1.1 ? '⚠️ RISK' : '✅ SAFE',
      updated: new Date(p.lastUpdateTimestamp * 1000).toLocaleTimeString()
    };
  }));

  console.log(`\nShowing ${results.length} of ${positions.length} matches.`);
}

main().catch(console.error);
