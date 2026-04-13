import { getPublicClient, getAddress } from '../utils/rpc';
import { getAssetCategory, getAssetPath } from '../utils/assets';
import { parseAbiItem } from 'viem';
const COMPTROLLER_ADDRESS = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C';
// Popular mTokens on Base
const M_TOKENS = {
    'mUSDC': { address: getAddress('0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22'), underlying: 'USDC', symbol: 'USDC' },
    'mWETH': { address: getAddress('0x628ff693426583D9a7FB391E54366292F509D457'), underlying: 'WETH', symbol: 'WETH' },
    'mcbBTC': { address: getAddress('0xcB575382098675549887e2247164929D1302506B'), underlying: 'cbBTC', symbol: 'cbBTC' },
    'mUSDT': { address: getAddress('0x3865dfD4D2aCb8F0C601b69B8f5951dC55De9A0d'), underlying: 'USDT', symbol: 'USDT' },
};
export class MoonwellScanner {
    db;
    status = {
        isScanning: false,
        lastSyncedBlock: 0,
    };
    chain = 'Base';
    constructor(db) {
        this.db = db;
    }
    getName() {
        return 'Moonwell (Base)';
    }
    getStatus() {
        return this.status;
    }
    getClient() {
        return getPublicClient(this.chain);
    }
    async scanGlobal() {
        // For Moonwell, we'll sync rates for popular assets
        await this.syncAllRates(this.db);
    }
    async scanIncremental() {
        await this.syncAllRates(this.db);
    }
    async scanRange(fromBlock, toBlock) {
        // Moonwell scanner focused on rates for now
    }
    async getMarketRate(collateralAsset, debtAsset, marketId) {
        const client = this.getClient();
        const mToken = Object.values(M_TOKENS).find(t => t.address.toLowerCase() === marketId?.toLowerCase());
        if (!mToken)
            return null;
        try {
            const borrowRatePerTimestamp = await client.readContract({
                address: mToken.address,
                abi: [parseAbiItem('function borrowRatePerTimestamp() view returns (uint256)')],
                functionName: 'borrowRatePerTimestamp',
            });
            // Rate is per second, convert to annual
            const annualRate = (Number(borrowRatePerTimestamp) / 1e18) * 31536000;
            return annualRate;
        }
        catch (e) {
            console.error(`[Moonwell] Failed to fetch rate for ${mToken.symbol}:`, e);
            return null;
        }
    }
    async syncAllRates(db) {
        console.log(`[Moonwell] Syncing all Moonwell rates on ${this.chain}...`);
        const client = this.getClient();
        const timestamp = Math.floor(Date.now() / 1000);
        for (const [key, market] of Object.entries(M_TOKENS)) {
            try {
                const rate = await this.getMarketRate('', '', market.address);
                if (rate !== null) {
                    await db.upsertRate({
                        protocol: this.getName(),
                        assetPair: `WETH/${market.symbol}`, // Placeholder pair
                        rate: rate,
                        lastUpdateTimestamp: timestamp,
                        chain: this.chain,
                        collateralSymbol: 'WETH',
                        debtSymbol: market.symbol,
                        isRWA: false,
                        ltv: 0.8, // Approximation
                        liquidationThreshold: 0.85,
                        liquidationPenalty: 0.05,
                        collateralCategory: getAssetCategory('WETH'),
                        debtCategory: getAssetCategory(market.symbol),
                        collateralPath: getAssetPath('WETH'),
                        debtPath: getAssetPath(market.symbol)
                    });
                    console.log(`[Moonwell] Synced ${market.symbol}: ${(rate * 100).toFixed(2)}%`);
                }
            }
            catch (e) {
                console.error(`[Moonwell] Failed to sync ${market.symbol}:`, e);
            }
        }
    }
}
