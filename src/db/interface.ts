import { Kysely } from 'kysely';

export interface LoanPosition {
  id: string; // protocol_user_market
  protocol: string;
  userAddress: string;
  marketId: string;
  collateralAsset: string;
  collateralSymbol: string;
  collateralAmount: string;
  collateralDecimals: number;
  debtAsset: string;
  debtSymbol: string;
  debtAmount: string;
  debtDecimals: number;
  healthFactor: number | null;
  ltv: number | null;
  liquidationPrice: number | null;
  lastUpdateBlock: number;
  lastUpdateTimestamp: number;
  chain: string;
}

export interface BlockCursor {
  protocol: string;
  lastSyncedBlock: number;
}

export interface AssetPrice {
  symbol: string;
  price: number;
  lastUpdateTimestamp: number;
}

export interface MarketRate {
  protocol: string;
  assetPair: string; // e.g., 'ETH/USDC'
  rate: number;
  lastUpdateTimestamp: number;
  chain: string;
  collateralSymbol: string;
  debtSymbol: string;
  isRWA?: boolean;
  ltv: number | null; // This will be used as Max LTV
  liquidationThreshold: number | null;
  liquidationPenalty: number | null;
  collateralCategory: string; // e.g., 'ETH', 'BTC', 'USD'
  debtCategory: string; // e.g., 'USD'
  collateralPath: string | null;
  debtPath: string | null;
  rateType: 'fixed' | 'floating';
}

export interface DatabaseSchema {
  positions: LoanPosition;
  block_cursors: BlockCursor;
  prices: AssetPrice;
  rates: MarketRate;
}

export interface ILoanRepository {
  upsertPosition(position: LoanPosition): Promise<void>;
  getPositionsByProtocol(protocol: string): Promise<LoanPosition[]>;
  getAllPositions(): Promise<LoanPosition[]>;
  updateBlockCursor(protocol: string, blockNumber: number): Promise<void>;
  getBlockCursor(protocol: string): Promise<number>;
  upsertPrice(price: AssetPrice): Promise<void>;
  getAllPrices(): Promise<AssetPrice[]>;
  upsertRate(rate: MarketRate): Promise<void>;
  getAllRates(): Promise<MarketRate[]>;
  deleteRatesForProtocol(protocol: string): Promise<void>;
  close(): Promise<void>;
}
