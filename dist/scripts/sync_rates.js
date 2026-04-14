import { getDatabaseAdapter } from '../db/index.js';
import { MorphoScanner } from '../protocols/morpho.js';
import { AaveScanner } from '../protocols/aave.js';
import { LiquityScanner } from '../protocols/liquity.js';
import { LiquityV2Scanner } from '../protocols/liquityV2.js';
import { SkyScanner } from '../protocols/sky.js';
import { MakerScanner } from '../protocols/maker.js';
import { SolanaScanner } from '../protocols/solana.js';
import { MoonwellScanner } from '../protocols/moonwell.js';
import { getAssetCategory, getAssetPath } from '../utils/assets.js';
import { getAddress } from '../utils/rpc.js';
import { GCSStorage } from '../utils/gcs.js';
import { fileURLToPath } from 'url';
const ASSETS = {
    WETH: { symbol: 'WETH', address: getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') },
    WBTC: { symbol: 'WBTC', address: getAddress('0x2260FAC5E5542a773Aa44fBCfedF7C193bc2C599') },
    cbBTC: { symbol: 'cbBTC', address: getAddress('0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf') },
    wstETH: { symbol: 'wstETH', address: getAddress('0x7f39C581F595B53c5cb19bD0b3f8DA6c935E2Ca0') },
    weETH: { symbol: 'weETH', address: getAddress('0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee') },
    USDC: { symbol: 'USDC', address: getAddress('0xA0b86991c6218b36c1d19D4a2e9eb0cE3606eb48') },
    USDC_BASE: { symbol: 'USDC', address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') },
    USDT: { symbol: 'USDT', address: getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7') },
    DAI: { symbol: 'DAI', address: getAddress('0x6B175474E89094C44Da98B954EedeAC495271d0F') },
    USDS: { symbol: 'USDS', address: getAddress('0xdC035D45d973E3EC169d2276DDab16f1e407384F') },
    BOLD: { symbol: 'BOLD', address: getAddress('0x0000000000000000000000000000000000000000') }, // Placeholder if not live
    LUSD: { symbol: 'LUSD', address: getAddress('0x5f98805A4e8be255a32880FDeC7F6728C6568bA0') },
    LBTC: { symbol: 'LBTC', address: getAddress('0x8236a87084f851da573c773a908092241612788e') }, // Ethereum Lombard
    ctBTC: { symbol: 'WcBTC', address: getAddress('0x0000000000000000000000000000000000000000') }, // Placeholder for Citrea
};
function getAssetAddress(symbol, chain) {
    const mapping = {
        'Ethereum': {
            WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            WBTC: '0x2260FAC5E5542a773Aa44fBCfedF7C193bc2C599',
            cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            USDC: '0xA0b86991c6218b36c1d19D4a2e9eb0cE3606eb48',
            USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            DAI: '0x6B175474E89094C44Da98B954EedeAC495271d0F',
            USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
            wstETH: '0x7f39C581F595B53c5cb19bD0b3f8DA6c935E2Ca0',
            weETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
            LUSD: '0x5f98805A4e8be255a32880FDeC7F6728C6568bA0',
        },
        'Base': {
            WETH: '0x4200000000000000000000000000000000000006',
            cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            USDS: '0x8ce0E41852445E16f73449339e0ed887cbe8E8F5',
            wstETH: '0x5981503679241b9d799c4F7830897db7C26AA438',
            LBTC: '0x8236a87084f851da573c773a908092241612788e',
        },
        'Arbitrum': {
            WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            wstETH: '0x5979D7b546E38E414F7E9822514be443A4800529',
        }
    };
    const chainMap = mapping[chain] || mapping['Ethereum'];
    const addr = chainMap[symbol];
    return addr ? getAddress(addr) : null;
}
const PAIRS = [
    // WETH Collateral
    { coll: ASSETS.WETH, debt: ASSETS.USDC },
    { coll: ASSETS.WETH, debt: ASSETS.USDT },
    { coll: ASSETS.WETH, debt: ASSETS.DAI },
    { coll: ASSETS.WETH, debt: ASSETS.USDS },
    { coll: ASSETS.WETH, debt: ASSETS.BOLD },
    { coll: ASSETS.WETH, debt: ASSETS.LUSD },
    // WBTC / cbBTC Collateral
    { coll: ASSETS.WBTC, debt: ASSETS.USDC },
    { coll: ASSETS.WBTC, debt: ASSETS.DAI },
    { coll: ASSETS.cbBTC, debt: ASSETS.USDC },
    // LST Collateral
    { coll: ASSETS.wstETH, debt: ASSETS.USDS },
    { coll: ASSETS.wstETH, debt: ASSETS.BOLD },
    { coll: ASSETS.weETH, debt: ASSETS.USDS },
];
async function syncAllRates(passedDb) {
    console.log('--- Starting Comprehensive Interest Rate Sync ---');
    const db = passedDb || await getDatabaseAdapter();
    if (process.env.NODE_ENV === 'production') {
        console.log('[SYNC] Checking GCS for updates...');
        const gcsUpdatedTime = await GCSStorage.getUpdatedTime();
        const lastGcsSync = await db.getMetadata('last_gcs_sync_time');
        const localLastSync = lastGcsSync ? parseInt(lastGcsSync) : 0;
        // Use UTC for all time calculations
        const nowUtc = Math.floor(Date.now() / 1000);
        const STALE_THRESHOLD_SECONDS = 30 * 60; // 30 minutes
        if (gcsUpdatedTime && gcsUpdatedTime > localLastSync) {
            console.log(`[SYNC] GCS file is newer (${new Date(gcsUpdatedTime).toISOString()} > ${new Date(localLastSync).toISOString()}). Downloading...`);
            // Close current DB connection before overwriting file
            if (!passedDb)
                await db.close();
            const success = await GCSStorage.restore();
            if (success) {
                // Re-open DB and update metadata
                const newDb = passedDb || await getDatabaseAdapter();
                await newDb.setMetadata('last_gcs_sync_time', gcsUpdatedTime.toString());
                // Internal Staleness Check: Even if GCS file is newer metadata-wise, 
                // the rates inside might be stale.
                const latestRateTime = await newDb.getLatestRateTimestamp();
                const isStale = (nowUtc - latestRateTime) > STALE_THRESHOLD_SECONDS;
                if (!isStale) {
                    console.log(`[SYNC] Database updated from GCS and data is fresh (latest rate from ${new Date(latestRateTime * 1000).toISOString()}). Skipping RPC sync.`);
                    if (!passedDb)
                        await newDb.close();
                    return;
                }
                else {
                    console.log(`[SYNC] Database updated from GCS but data is stale (latest rate from ${new Date(latestRateTime * 1000).toISOString()}). Proceeding with RPC sync.`);
                    // Continue to RPC sync using the newly restored DB
                }
            }
            else {
                console.warn('[SYNC] Failed to download from GCS, proceeding with RPC sync.');
            }
        }
        else {
            console.log('[SYNC] GCS file is up to date or older. Proceeding with RPC sync.');
        }
    }
    const scanners = [
        // Ethereum Mainnet
        new MorphoScanner(db, 'Ethereum'),
        new AaveScanner(db, 'Ethereum'),
        new LiquityScanner(db),
        new LiquityV2Scanner(db),
        new SkyScanner(db),
        new MakerScanner(db),
        // Base
        new MorphoScanner(db, 'Base'),
        new AaveScanner(db, 'Base'),
        new MoonwellScanner(db),
        // Arbitrum
        new AaveScanner(db, 'Arbitrum'),
        new MorphoScanner(db, 'Arbitrum'),
        // Solana
        new SolanaScanner(db),
    ];
    const timestamp = Math.floor(Date.now() / 1000);
    let successCount = 0;
    let failCount = 0;
    // --- Phase 1: Priority Pass (Sync Stale Assets) ---
    console.log('\n--- Phase 1: Priority Pass (Stale Assets) ---');
    const oldestRates = await db.getOldestRates(20);
    console.log(`Prioritizing ${oldestRates.length} oldest rates...`);
    for (const rate of oldestRates) {
        const scanner = scanners.find(s => s.getName() === rate.protocol && (s.chain || 'Ethereum') === rate.chain);
        if (!scanner)
            continue;
        try {
            console.log(`[PRIORITY] ${rate.protocol} (${rate.chain}) ${rate.assetPair}...`);
            const symbols = rate.assetPair.split('/');
            const collSymbol = symbols[0];
            const debtSymbol = symbols[1];
            const collAddr = getAssetAddress(collSymbol, rate.chain);
            const debtAddr = getAssetAddress(debtSymbol, rate.chain);
            if (!collAddr || !debtAddr)
                continue;
            // Determine marketId if possible
            let marketId = undefined;
            if (rate.protocol.includes('Maker')) {
                if (collSymbol === 'WETH')
                    marketId = 'ETH-A';
                else if (collSymbol === 'WBTC')
                    marketId = 'WBTC-A';
                else if (collSymbol === 'wstETH')
                    marketId = 'WSTETH-A';
            }
            const newRate = await scanner.getMarketRate(collAddr, debtAddr, marketId);
            if (newRate !== null) {
                await db.upsertRate({
                    ...rate,
                    rate: newRate,
                    lastUpdateTimestamp: timestamp
                });
                console.log(`[SUCCESS] Refreshed ${rate.protocol} ${rate.assetPair}: ${(newRate * 100).toFixed(2)}%`);
                successCount++;
            }
            // Strict 1s delay as requested
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        catch (e) {
            console.error(`[FAILED] Priority refresh for ${rate.assetPair}:`, e.message);
            failCount++;
        }
    }
    // --- Phase 2: Regular Sync & Discovery ---
    console.log('\n--- Phase 2: Regular Sync & Discovery ---');
    for (const scanner of scanners) {
        const protocolName = scanner.getName();
        console.log(`\nChecking protocol: ${protocolName}`);
        if (scanner.syncAllRates) {
            await scanner.syncAllRates(db);
        }
        // Only run specific pairs for scanners that don't have syncAllRates
        // or to ensure specific critical pairs are tracked.
        for (const pair of PAIRS) {
            try {
                let marketId = undefined;
                // Protocol-specific market selection logic
                if (protocolName.includes('Morpho Blue')) {
                    // Morpho is handled by syncAllRates for broad coverage
                    continue;
                }
                else if (protocolName.includes('Maker MCD')) {
                    if (pair.debt.symbol !== 'DAI')
                        continue; // Maker only lends DAI
                    if (pair.coll.symbol === 'WETH')
                        marketId = 'ETH-A';
                    else if (pair.coll.symbol === 'WBTC')
                        marketId = 'WBTC-A';
                    else if (pair.coll.symbol === 'wstETH')
                        marketId = 'WSTETH-A';
                    else
                        continue;
                }
                else if (protocolName.includes('Liquity V2')) {
                    // Liquity V2 is handled by syncAllRates for branch discovery
                    continue;
                }
                else if (protocolName.includes('Liquity V1')) {
                    if (pair.coll.symbol !== 'WETH' || pair.debt.symbol !== 'LUSD')
                        continue;
                }
                else if (protocolName.includes('Sky')) {
                    if (pair.debt.symbol !== 'USDS')
                        continue;
                }
                else if (protocolName.includes('Moonwell')) {
                    continue; // Handled by syncAllRates
                }
                const chainName = scanner.chain || 'Ethereum';
                const collateralAddress = getAssetAddress(pair.coll.symbol, chainName);
                const debtAddress = getAssetAddress(pair.debt.symbol, chainName);
                if (!collateralAddress || !debtAddress)
                    continue;
                const rate = await scanner.getMarketRate(collateralAddress, debtAddress, marketId);
                if (rate !== null) {
                    // Filter out extreme outliers (e.g., > 1000% APY) which are likely niche/broken markets
                    if (rate > 10) {
                        console.warn(`[SKIP] ${protocolName} ${pair.coll.symbol}/${pair.debt.symbol} rate too high: ${(rate * 100).toFixed(2)}%`);
                        continue;
                    }
                    let ltv = null;
                    let liqThreshold = null;
                    let liqPenalty = null;
                    if (protocolName.includes('Maker MCD') || protocolName.includes('Sky')) {
                        liqThreshold = protocolName.includes('Sky') ? 1 / 1.30 : (pair.coll.symbol === 'WETH' ? 1 / 1.45 : (pair.coll.symbol === 'WBTC' ? 1 / 1.75 : 1 / 1.60));
                        ltv = liqThreshold * 0.8; // Recommend 20% safety buffer for Maker/Sky
                        liqPenalty = 0.13; // 13% Maker/Sky penalty
                    }
                    else if (protocolName.includes('Liquity V1')) {
                        liqThreshold = 1 / 1.10;
                        ltv = liqThreshold * 0.9; // Recommend 10% safety buffer for Liquity (more efficient)
                        liqPenalty = 0.10; // 10% Liquity bonus
                    }
                    if (protocolName.includes('Aave')) {
                        // Fetch LTV/LT from config if possible
                        try {
                            const client = scanner.getClient();
                            const config = await client.readContract({
                                address: scanner.dataProviderAddress,
                                abi: [{
                                        "inputs": [{ "name": "asset", "type": "address" }],
                                        "name": "getReserveConfigurationData",
                                        "outputs": [
                                            { "name": "ltv", "type": "uint256" },
                                            { "name": "liquidationThreshold", "type": "uint256" },
                                            { "name": "liquidationBonus", "type": "uint256" },
                                            { "name": "decimals", "type": "uint256" },
                                            { "name": "reserveFactor", "type": "uint256" },
                                            { "name": "usageAsCollateralEnabled", "type": "bool" },
                                            { "name": "borrowingEnabled", "type": "bool" },
                                            { "name": "stableBorrowRateEnabled", "type": "bool" },
                                            { "name": "isActive", "type": "bool" },
                                            { "name": "isFrozen", "type": "bool" }
                                        ],
                                        "stateMutability": "view",
                                        "type": "function"
                                    }],
                                functionName: 'getReserveConfigurationData',
                                args: [collateralAddress],
                            });
                            ltv = Number(config.ltv ?? 0) / 10000;
                            liqThreshold = Number(config.liquidationThreshold ?? 0) / 10000;
                            liqPenalty = (Number(config.liquidationBonus ?? 10000) - 10000) / 10000;
                        }
                        catch (e) {
                            // Fallback to defaults or skip
                        }
                    }
                    await db.upsertRate({
                        protocol: protocolName,
                        assetPair: `${pair.coll.symbol}/${pair.debt.symbol}`,
                        rate: rate,
                        lastUpdateTimestamp: timestamp,
                        chain: scanner.chain || 'Ethereum',
                        collateralSymbol: pair.coll.symbol,
                        debtSymbol: pair.debt.symbol,
                        isRWA: false,
                        ltv: ltv,
                        liquidationThreshold: liqThreshold,
                        liquidationPenalty: liqPenalty,
                        collateralCategory: getAssetCategory(pair.coll.symbol),
                        debtCategory: getAssetCategory(pair.debt.symbol),
                        collateralPath: getAssetPath(pair.coll.symbol),
                        debtPath: getAssetPath(pair.debt.symbol),
                        rateType: protocolName.includes('Liquity V1') ? 'fixed' : 'floating'
                    });
                    console.log(`[SUCCESS] ${protocolName} ${pair.coll.symbol}/${pair.debt.symbol}: ${(rate * 100).toFixed(2)}%`);
                    successCount++;
                    // Strict 1s delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (e) {
                console.error(`[ERROR] ${protocolName} ${pair.coll.symbol}/${pair.debt.symbol}: ${e.message || e}`);
                failCount++;
            }
        }
    }
    // --- Manual/Ecosystem Injection for New protocols (Citrea/Zentra) ---
    console.log('\n--- Syncing Citrea Ecosystem (Zentra Finance) ---');
    try {
        const citreaRates = [
            { coll: 'WcBTC', debt: 'ctUSD', rate: 0.0222, ltv: 0.80, threshold: 0.85, protocol: 'Zentra (Citrea)' },
            { coll: 'WcBTC', debt: 'WcBTC', rate: 0.0058, ltv: 0.85, threshold: 0.90, protocol: 'Zentra (Citrea)' }
        ];
        for (const r of citreaRates) {
            await db.upsertRate({
                protocol: r.protocol,
                assetPair: `${r.coll}/${r.debt}`,
                rate: r.rate,
                lastUpdateTimestamp: timestamp,
                chain: 'Citrea',
                collateralSymbol: r.coll,
                debtSymbol: r.debt,
                isRWA: false,
                ltv: r.ltv,
                liquidationThreshold: r.threshold,
                liquidationPenalty: 0.05,
                collateralCategory: 'BTC',
                debtCategory: getAssetCategory(r.debt),
                collateralPath: 'BTC ➔ ctBTC',
                debtPath: null,
                rateType: 'floating'
            });
            console.log(`[SUCCESS] ${r.protocol} ${r.coll}/${r.debt}: ${(r.rate * 100).toFixed(2)}%`);
            successCount++;
        }
    }
    catch (e) {
        console.error('Failed to sync Citrea manual rates:', e);
    }
    console.log('\n--- Syncing Institutional RWA Markets (Aave Horizon) ---');
    try {
        const institutionalRates = [
            {
                coll: 'Ondo OUSG',
                debt: 'GHO',
                rate: 0.055,
                ltv: 0.85,
                threshold: 0.90,
                protocol: 'Aave Horizon',
                chain: 'Ethereum',
                category: 'USD', // OUSG is pegged to USD
                path: 'Treasuries ➔ OUSG'
            }
        ];
        for (const r of institutionalRates) {
            await db.upsertRate({
                protocol: r.protocol,
                assetPair: `${r.coll}/${r.debt}`,
                rate: r.rate,
                lastUpdateTimestamp: timestamp,
                chain: r.chain,
                collateralSymbol: r.coll,
                debtSymbol: r.debt,
                isRWA: true,
                ltv: r.ltv,
                liquidationThreshold: r.threshold,
                liquidationPenalty: 0.05,
                collateralCategory: r.category,
                debtCategory: getAssetCategory(r.debt),
                collateralPath: r.path,
                debtPath: null,
                rateType: 'floating'
            });
            console.log(`[SUCCESS] ${r.protocol} ${r.coll}/${r.debt}: ${(r.rate * 100).toFixed(2)}%`);
            successCount++;
        }
    }
    catch (e) {
        console.error('Failed to sync Institutional manual rates:', e);
    }
    console.log(`\n--- Sync Finished ---`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    if (!passedDb) {
        await db.close();
    }
    if (process.env.NODE_ENV === 'production') {
        await GCSStorage.backup();
    }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    syncAllRates().catch(console.error);
}
export { syncAllRates };
