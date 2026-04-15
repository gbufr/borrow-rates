export interface MarketRate {
  protocol: string;
  assetPair: string;
  rate: number;
  lastUpdateTimestamp: number;
  chain: string;
  collateralSymbol: string;
  debtSymbol: string;
  isRWA?: boolean;
  ltv: number | null;
  liquidationThreshold: number | null;
  liquidationPenalty: number | null;
  collateralCategory: string;
  debtCategory: string;
  collateralPath: string | null;
  debtPath: string | null;
  rateType: 'fixed' | 'floating';
}
