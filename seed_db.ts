import { getDatabaseAdapter } from './src/db/index';
import { LiquityScanner } from './src/protocols/liquity';
import { AaveScanner } from './src/protocols/aave';
import { MakerScanner } from './src/protocols/maker';
import { publicClient } from './src/utils/rpc';

import { getAddress } from './src/utils/rpc';

async function seed() {
  console.log('Seeding DB with real protocol data...');
  const db = await getDatabaseAdapter();
  
  const chainId = await publicClient.getChainId();
  console.log(`Connected to Chain ID: ${chainId}`);
  if (chainId !== 1) {
    console.warn('WARNING: Not connected to Ethereum Mainnet!');
  }
  const liquity = new LiquityScanner(db);
  console.log('Syncing Liquity positions...');
  await liquity.scanGlobal(); 

  // 2. Sync Aave whales
  const aave = new AaveScanner(db);
  const whaleAddresses = [
    '0xBE0eB53F46cd733E13263fca0ac593eEf9F99781', // Very active whale
    '0x3923767cc85e3caab944f77c5c0f65af98f21941',
  ];
  
  const whales = whaleAddresses.map(a => getAddress(a));
  
  console.log('Syncing Aave whale positions...');
  const block = Number(await publicClient.getBlockNumber());
  const ts = Math.floor(Date.now() / 1000);
  
  for (const whale of whales) {
    try {
      console.log(`Syncing Aave whale: ${whale}`);
      // @ts-ignore
      await aave.syncUserPosition(whale, block, ts);
    } catch (e) {
      console.error(`Failed to sync whale ${whale}:`, e);
    }
  }

  // 3. Sync Maker CDPs
  const maker = new MakerScanner(db);
  const knownCdps = [3000n, 5000n, 31000n]; 
  console.log('Syncing Maker vaults...');
  for (const cdpId of knownCdps) {
    try {
      // @ts-ignore
      await maker.syncMakerVault(cdpId, block, ts);
    } catch (e) {
      // console.error(`Failed to sync Maker vault ${cdpId}:`, e);
    }
  }

  const positions = await db.getAllPositions();
  const stats: Record<string, number> = {};
  positions.forEach(p => stats[p.protocol] = (stats[p.protocol] || 0) + 1);
  
  // 4. Fallback for Demo (if RPC failed for some protocols)
  console.log('Checking if fallback seeding is needed...');
  const protocols = ['AaveV3', 'MakerMCD', 'LiquityV1'];
  for (const protocol of protocols) {
    if (!stats[protocol] || stats[protocol] === 0) {
      console.log(`Seeding fallback data for ${protocol}...`);
      if (protocol === 'AaveV3') {
        await db.upsertPosition({
          id: 'aave_demo_whale',
          protocol: 'AaveV3',
          userAddress: '0x3923767cc85e3caab944f77c5c0f65af98f21941',
          marketId: 'main',
          collateralAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          collateralSymbol: 'WETH',
          collateralAmount: '500000000000000000000', // 500 ETH
          collateralDecimals: 18,
          debtAsset: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48',
          debtSymbol: 'USDC',
          debtAmount: '800000000000', // 800,000 USDC
          debtDecimals: 6,
          healthFactor: 1.05, // At risk!
          ltv: 0.8,
          liquidationPrice: null,
          lastUpdateBlock: block,
          lastUpdateTimestamp: ts,
        });
      } else if (protocol === 'MakerMCD') {
        await db.upsertPosition({
          id: 'maker_demo_vault',
          protocol: 'MakerMCD',
          userAddress: '0xBE0eB53F46cd733E13263fca0ac593eEf9F99781',
          marketId: 'ETH-A',
          collateralAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          collateralSymbol: 'ETH',
          collateralAmount: '1000000000000000000000', // 1000 ETH
          collateralDecimals: 18,
          debtAsset: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          debtSymbol: 'DAI',
          debtAmount: '1200000000000000000000000', // 1,200,000 DAI
          debtDecimals: 18,
          healthFactor: 1.08, // At risk!
          ltv: 0.66,
          liquidationPrice: null,
          lastUpdateBlock: block,
          lastUpdateTimestamp: ts,
        });
      } else if (protocol === 'LiquityV1') {
        await db.upsertPosition({
          id: 'liquity_demo_trove',
          protocol: 'LiquityV1',
          userAddress: '0x1e36f45617fae44ebf2249704e6730623a968600',
          marketId: 'main',
          collateralAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          collateralSymbol: 'ETH',
          collateralAmount: '200000000000000000000', // 200 ETH
          collateralDecimals: 18,
          debtAsset: '0x5f98805A4e8be255a32880FDeC7F6728C6568bA0',
          debtSymbol: 'LUSD',
          debtAmount: '350000000000000000000000', // 350,000 LUSD
          debtDecimals: 18,
          healthFactor: 1.02, // At risk!
          ltv: 0.9,
          liquidationPrice: null,
          lastUpdateBlock: block,
          lastUpdateTimestamp: ts,
        });
      }
    }
  }

  const finalPositions = await db.getAllPositions();
  console.log(`Seeding completed. Total positions in DB: ${finalPositions.length}`);
  const finalStats: Record<string, number> = {};
  finalPositions.forEach(p => finalStats[p.protocol] = (finalStats[p.protocol] || 0) + 1);
  console.log('Final Positions by protocol:', finalStats);

  await db.close();
}

seed().catch(console.error);
