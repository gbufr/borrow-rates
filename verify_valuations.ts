import { RiskService } from './src/utils/risk';

async function verify() {
  const riskService = new RiskService();
  
  const positions = [
    {
      name: 'mKGLD Position',
      collateralAsset: '0x5c275d38a23bbf2e1bc28b88093aeb60e49de8fe',
      collateralSymbol: 'mKGLD',
      collateralAmount: (100n * 10n**18n).toString(),
      collateralDecimals: 18,
      debtAsset: '0xcc7b0546991e25dda448f8048a1e8e43135cbc39',
      debtSymbol: 'mJPYC',
      debtAmount: (1416710n * 10n**18n).toString(),
      debtDecimals: 18,
      protocol: 'MorphoBlue'
    },
    {
      name: 'USR Position',
      collateralAsset: '0x8413d2a624a9fa8b6d3ec7b22cf7f62e55d6bc83',
      collateralSymbol: 'BONDUSD',
      collateralAmount: (1000000000n * 10n**18n).toString(),
      collateralDecimals: 18,
      debtAsset: '0x66a1e37c9b0eaddca17d3662d6c05f4dedf3e110',
      debtSymbol: 'USR',
      debtAmount: (14045261503n * 10n**18n).toString(),
      debtDecimals: 18,
      protocol: 'MorphoBlue'
    }
  ];

  for (const p of positions) {
    console.log(`\n--- ${p.name} ---`);
    const collPrice = riskService.getPriceForAsset(p.collateralAsset, p.collateralSymbol);
    const debtPrice = riskService.getPriceForAsset(p.debtAsset, p.debtSymbol);
    
    const collAmount = Number(p.collateralAmount) / Math.pow(10, p.collateralDecimals);
    const debtAmount = Number(p.debtAmount) / Math.pow(10, p.debtDecimals);
    
    const collUSD = collAmount * collPrice;
    const debtUSD = debtAmount * debtPrice;
    const hf = riskService.calculateHealthFactor(p);

    console.log(`Collateral: ${collAmount} ${p.collateralSymbol} (@$${collPrice}) = $${collUSD.toLocaleString()}`);
    console.log(`Debt: ${debtAmount} ${p.debtSymbol} (@$${debtPrice}) = $${debtUSD.toLocaleString()}`);
    console.log(`Health Factor: ${hf.toFixed(4)}`);
  }
}

verify();
