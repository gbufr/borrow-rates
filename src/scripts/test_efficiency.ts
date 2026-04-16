import { RiskService } from '../utils/risk.js';
import { getDatabaseAdapter } from '../db/index.js';

async function test() {
  console.log('--- Loan Efficiency Score Verification ---');
  const db = await getDatabaseAdapter();
  const risk = new RiskService(db);
  
  const mockPositions = [
    {
      protocol: 'AaveV3',
      collateralSymbol: 'USDC',
      collateralAmount: '1000000', // $1.00
      collateralDecimals: 6,
      debtSymbol: 'USDT',
      debtAmount: '800000',
      debtDecimals: 6,
      collateralAsset: '0x...',
      debtAsset: '0x...'
    },
    {
      protocol: 'AaveV3',
      collateralSymbol: 'WETH',
      collateralAmount: '1000000000000000000', // 1 ETH ($2500 fallback)
      collateralDecimals: 18,
      debtSymbol: 'USDC',
      debtAmount: '1500000000', // $1500
      debtDecimals: 6,
      collateralAsset: '0x...',
      debtAsset: '0x...'
    },
    {
      protocol: 'AaveV3',
      collateralSymbol: 'wstETH',
      collateralAmount: '1000000000000000000', // 1 wstETH
      collateralDecimals: 18,
      debtSymbol: 'USDC',
      debtAmount: '1500000000', // $1500
      debtDecimals: 6,
      collateralAsset: '0x...',
      debtAsset: '0x...'
    }
  ];

  for (const pos of mockPositions) {
    const hf = risk.calculateHealthFactor(pos);
    const score = risk.calculateEfficiencyScore(pos);
    console.log(`\nCollateral: ${pos.collateralSymbol} | Debt: ${pos.debtSymbol}`);
    console.log(`Health Factor: ${hf.toFixed(2)}`);
    console.log(`Efficiency Score: ${score.toFixed(2)}`);
    
    let status = 'Balanced';
    if (score < 1.2) status = 'Risk';
    if (score > 2.0) status = 'Inefficient';
    console.log(`Status: ${status}`);
  }

  await db.close();
}

test().catch(console.error);
