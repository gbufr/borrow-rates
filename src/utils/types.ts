export interface ScannerStatus {
  isScanning: boolean;
  lastSyncedBlock: number;
  error?: string;
}

export interface ProtocolScanner {
  getName(): string;
  scanGlobal(): Promise<void>;
  scanIncremental(): Promise<void>;
  scanRange(fromBlock: bigint, toBlock: bigint): Promise<void>;
  getStatus(): ScannerStatus;
  getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null>;
  syncAllRates?(db: any): Promise<void>;
  chain: string;
}

export interface PositionData {
  id: string;
  protocol: string;
  userAddress: string;
  marketId: string;
  collateralAsset: string;
  collateralAmount: bigint;
  debtAsset: string;
  debtAmount: bigint;
  healthFactor: number | null;
  ltv: number | null;
  liquidationPrice: number | null;
}
