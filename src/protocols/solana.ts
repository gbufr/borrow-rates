import { ILoanRepository } from '../db/interface.js';
import { ProtocolScanner, ScannerStatus } from '../utils/types.js';
import { getAssetCategory, getAssetPath } from '../utils/assets.js';
import axios from 'axios';

const KAMINO_API_URL = 'https://api.kamino.finance/v1/markets/main';
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
    console.log(`[${this.getName()}] Fetching Kamino rates...`);
    try {
      const response: any = await axios.get(KAMINO_API_URL);
      const data = response.data;
      const timestamp = Math.floor(Date.now() / 1000);

      if (data && data.reserves) {
        for (const reserve of data.reserves) {
          const symbol = reserve.token?.symbol;
          if (!symbol) continue;

          if (['SOL', 'USDC', 'USDT'].includes(symbol)) {
            const borrowRate = Number(reserve.borrowRate) / 100;
            
            await db.upsertRate({
              protocol: 'Kamino (Solana)',
              assetPair: `SOL/${symbol}`,
              rate: borrowRate,
              lastUpdateTimestamp: timestamp,
              chain: this.chain,
              collateralSymbol: 'SOL',
              debtSymbol: symbol,
              isRWA: false,
              ltv: reserve.maxLtv ? Number(reserve.maxLtv) / 100 : 0.8,
              liquidationThreshold: reserve.liquidationThreshold ? Number(reserve.liquidationThreshold) / 100 : 0.85,
              liquidationPenalty: 0.05,
              collateralCategory: 'SOL',
              debtCategory: getAssetCategory(symbol),
              collateralPath: null,
              debtPath: null,
              rateType: 'floating'
            });
          }
        }
      }
    } catch (e: any) {
      console.error(`[Kamino] Failed:`, e.message);
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
