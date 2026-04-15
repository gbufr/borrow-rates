import { ILoanRepository } from '../db/interface.js';
import { ProtocolScanner, ScannerStatus } from '../utils/types.js';
import { getAssetCategory, getAssetPath } from '../utils/assets.js';
import axios from 'axios';

const KAMINO_MARKETS = [
  { id: '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF', name: 'Main' },
  { id: 'CqAoLuqWtavaVE8deBjMKe8ZfSt9ghR6Vb8nfsyabyHA', name: 'Prime' },
  { id: '47tfyEG9SsdEnUm9cw5kY9BXngQGqu3LBoop9j5uTAv8', name: 'OnRe' },
  { id: '6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y', name: 'Maple' },
  { id: 'CF32kn7AY8X1bW7ZkGcHc4X9ZWTxqKGCJk6QwrQkDcdw', name: 'Superstate' },
  { id: '52FSGeeokLpgvgAMdqxyt5Hoc2TbUYj5b8yxrEdZ37Vf', name: 'Huma' },
  { id: '9Y7uwXgQ68mGqRtZfuFaP4hc4fxeJ7cE9zTtqTxVhfGU', name: 'Solstice' },
];

const RWA_TOKENS = ['PRIME', 'ONYC', 'SYRUPUSDC', 'USCC', 'PST', 'EUSX'];
const SOLEND_API_URL = 'https://api.solend.fi/v1/markets/results?ids=main';

export class SolanaScanner implements ProtocolScanner {
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  public chain = 'Solana';

  constructor(private db: ILoanRepository) {}

  getName(): string {
    return 'Kamino (Solana)';
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  async scanGlobal(): Promise<void> {
    // Solana scan uses API, no block scanning needed for rates
    await this.syncAllRates(this.db);
  }

  async scanIncremental(): Promise<void> {
    await this.syncAllRates(this.db);
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    // API based, range not applicable
  }

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null> {
    // Rates are synced via syncAllRates
    return null;
  }

  async syncAllRates(db: ILoanRepository): Promise<void> {
    await this.syncKaminoRates(db);
    await this.syncSolendRates(db);
  }

  private async syncKaminoRates(db: ILoanRepository): Promise<void> {
    console.log(`[${this.getName()}] Fetching Kamino rates for ${KAMINO_MARKETS.length} markets...`);
    const timestamp = Math.floor(Date.now() / 1000);

    for (const market of KAMINO_MARKETS) {
      try {
        const url = `https://api.kamino.finance/kamino-market/${market.id}/reserves/metrics`;
        const response: any = await axios.get(url, {
          headers: {
            'Referer': 'https://kamino.com/',
            'Origin': 'https://kamino.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        const data = response.data;
        if (data && Array.isArray(data)) {
          // In isolated markets, we look for the USDC debt rate
          // but we attribute it to the RWA collateral of that market.
          const usdcReserve = data.find((r: any) => r.liquidityToken === 'USDC');
          const borrowRate = usdcReserve ? Number(usdcReserve.borrowApy) : 0;

          for (const reserve of data) {
            const symbol = reserve.liquidityToken;
            if (!symbol) continue;

            const isRWA = RWA_TOKENS.includes(symbol.toUpperCase());
            
            // If it's the main market, we sync SOL/USDC and SOL/USDT as before
            if (market.name === 'Main') {
              if (['USDC', 'USDT'].includes(symbol)) {
                await db.upsertRate({
                  protocol: `Kamino ${market.name} (Solana)`,
                  assetPair: `SOL/${symbol}`,
                  rate: Number(reserve.borrowApy),
                  lastUpdateTimestamp: timestamp,
                  chain: this.chain,
                  collateralSymbol: 'SOL',
                  debtSymbol: symbol,
                  isRWA: false,
                  ltv: 0.75,
                  liquidationThreshold: 0.80,
                  liquidationPenalty: 0.05,
                  collateralCategory: 'SOL',
                  debtCategory: getAssetCategory(symbol),
                  collateralPath: null,
                  debtPath: null,
                  rateType: 'floating'
                });
              }
            } else if (isRWA) {
              // In isolated RWA markets, we pair the RWA collateral with USDC debt
              await db.upsertRate({
                protocol: `Kamino ${market.name} (Solana)`,
                assetPair: `${symbol}/USDC`,
                rate: borrowRate,
                lastUpdateTimestamp: timestamp,
                chain: this.chain,
                collateralSymbol: symbol,
                debtSymbol: 'USDC',
                isRWA: true,
                ltv: 0.70,
                liquidationThreshold: 0.75,
                liquidationPenalty: 0.05,
                collateralCategory: getAssetCategory(symbol),
                debtCategory: 'USD',
                collateralPath: getAssetPath(symbol),
                debtPath: null,
                rateType: 'floating'
              });
              console.log(`[SUCCESS] Kamino RWA ${market.name} ${symbol}/USDC: ${(borrowRate * 100).toFixed(2)}%`);
            }
          }
        }
      } catch (e: any) {
        console.error(`[Kamino ${market.name}] Failed:`, e.message);
      }
    }
  }

  private async syncSolendRates(db: ILoanRepository): Promise<void> {
    console.log(`[Solend] Fetching Solend rates...`);
    try {
      const response: any = await axios.get(SOLEND_API_URL);
      const data = response.data;
      const timestamp = Math.floor(Date.now() / 1000);

      if (data && data.results && data.results[0]?.reserves) {
        for (const reserve of data.results[0].reserves) {
          const symbol = reserve.asset;
          if (!symbol) continue;

          if (['SOL', 'USDC', 'USDT'].includes(symbol)) {
            const borrowRate = Number(reserve.rates.borrow) / 100;
            
            await db.upsertRate({
              protocol: 'Solend (Solana)',
              assetPair: `SOL/${symbol}`,
              rate: borrowRate,
              lastUpdateTimestamp: timestamp,
              chain: this.chain,
              collateralSymbol: 'SOL',
              debtSymbol: symbol,
              isRWA: false,
              ltv: 0.75,
              liquidationThreshold: 0.80,
              liquidationPenalty: 0.05,
              collateralCategory: 'SOL',
              debtCategory: getAssetCategory(symbol),
              collateralPath: null,
              debtPath: null,
              rateType: 'floating'
            });
            console.log(`[SUCCESS] Solend ${symbol}: ${(borrowRate * 100).toFixed(2)}%`);
          }
        }
      }
    } catch (e: any) {
      console.error(`[Solend] Failed:`, e.message);
    }
  }
}
