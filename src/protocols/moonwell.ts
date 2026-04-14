import { getPublicClient, getAddress } from '../utils/rpc.js';
import { ILoanRepository, LoanPosition } from '../db/interface.js';
import { ProtocolScanner, ScannerStatus } from '../utils/types.js';
import { getAssetCategory, getAssetPath } from '../utils/assets.js';
import { parseAbiItem, formatUnits, erc20Abi } from 'viem';

const COMPTROLLER_ADDRESS = '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C';

// Popular mTokens on Base
const M_TOKENS: Record<string, { address: `0x${string}`; underlying: string; symbol: string }> = {
  'mUSDC': { address: getAddress('0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22'), underlying: 'USDC', symbol: 'USDC' },
  'mWETH': { address: getAddress('0x628ff693426583D9a7FB391E54366292F509D457'), underlying: 'WETH', symbol: 'WETH' },
  'mcbBTC': { address: getAddress('0xcB575382098675549887e2247164929D1302506B'), underlying: 'cbBTC', symbol: 'cbBTC' },
  'mUSDT': { address: getAddress('0x3865dfD4D2aCb8F0C601b69B8f5951dC55De9A0d'), underlying: 'USDT', symbol: 'USDT' },
  'mLBTC': { address: getAddress('0x10ff57879482d83769c0378e937d573b9fc5d2ee'), underlying: 'LBTC', symbol: 'LBTC' },
};

export class MoonwellScanner implements ProtocolScanner {
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  public chain = 'Base';

  constructor(private db: ILoanRepository) {}

  getName(): string {
    return 'Moonwell (Base)';
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  private getClient() {
    return getPublicClient(this.chain);
  }

  async scanGlobal(): Promise<void> {
    // For Moonwell, we'll sync rates for popular assets
    await this.syncAllRates(this.db);
  }

  async scanIncremental(): Promise<void> {
    await this.syncAllRates(this.db);
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    // Moonwell scanner focused on rates for now
  }

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null> {
    const client = this.getClient();
    const mToken = Object.values(M_TOKENS).find(t => t.address.toLowerCase() === marketId?.toLowerCase());
    if (!mToken) return null;

    try {
      const borrowRatePerTimestamp = await client.readContract({
        address: mToken.address,
        abi: [parseAbiItem('function borrowRatePerTimestamp() view returns (uint256)')],
        functionName: 'borrowRatePerTimestamp',
      }) as bigint;

      // Rate is per second, convert to annual
      const annualRate = (Number(borrowRatePerTimestamp) / 1e18) * 31536000;
      return annualRate;
    } catch (e) {
      console.error(`[Moonwell] Failed to fetch rate for ${mToken.symbol}:`, e);
      return null;
    }
  }

  async syncAllRates(db: ILoanRepository): Promise<void> {
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
            debtPath: getAssetPath(market.symbol),
            rateType: 'floating'
          });
          console.log(`[Moonwell] Synced ${market.symbol}: ${(rate * 100).toFixed(2)}%`);
        }
      } catch (e) {
        console.error(`[Moonwell] Failed to sync ${market.symbol}:`, e);
      }
    }
  }
}
