import { getPublicClient, getLogsInChunks, getAddress } from '../utils/rpc';
import { ILoanRepository, LoanPosition } from '../db/interface';
import { ProtocolScanner, ScannerStatus } from '../utils/types';
import { parseAbiItem } from 'viem';
import pLimit from 'p-limit';

const ADDRESSES: Record<string, { pool: `0x${string}`; dataProvider: `0x${string}` }> = {
  'Ethereum': {
    pool: getAddress('0x87870B2ec3AcDbfd0Dd2072F2FE2E116001f9560'),
    dataProvider: getAddress('0x7B4EBb212BB4Ba9709605009941bdc39e0C48CaA'),
  },
  'Base': {
    pool: getAddress('0xA238Dd80C259a72e81d7e4674A963912f6189913'),
    dataProvider: getAddress('0x2d8A3C5677189723C4cB487375d32e7e72545628'),
  },
  'Arbitrum': {
    pool: getAddress('0x794a61358D6845594F94dc1DB02A252b5b4814aD'),
    dataProvider: getAddress('0x69FA688f1Dc47d4B5d70297C0c05E4aF3895C846'),
  },
};

const AAVE_POOL_ABI = [
  {
    "inputs": [{ "name": "asset", "type": "address" }],
    "name": "getReserveData",
    "outputs": [
      { "name": "unbacked", "type": "uint256" },
      { "name": "accruedToTreasuryScaled", "type": "uint256" },
      { "name": "totalAToken", "type": "uint256" },
      { "name": "totalStableDebt", "type": "uint256" },
      { "name": "totalVariableDebt", "type": "uint256" },
      { "name": "liquidityRate", "type": "uint256" },
      { "name": "variableBorrowRate", "type": "uint256" },
      { "name": "stableBorrowRate", "type": "uint256" },
      { "name": "averageStableBorrowRate", "type": "uint256" },
      { "name": "liquidityIndex", "type": "uint256" },
      { "name": "variableBorrowIndex", "type": "uint256" },
      { "name": "lastUpdateTimestamp", "type": "uint40" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserAccountData",
    "outputs": [
      { "name": "totalCollateralBase", "type": "uint256" },
      { "name": "totalDebtBase", "type": "uint256" },
      { "name": "availableBorrowsBase", "type": "uint256" },
      { "name": "currentLiquidationThreshold", "type": "uint256" },
      { "name": "ltv", "type": "uint256" },
      { "name": "healthFactor", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export class AaveScanner implements ProtocolScanner {
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  private poolAddress: `0x${string}`;
  private dataProviderAddress: `0x${string}`;

  constructor(private db: ILoanRepository, public chain: string = 'Ethereum') {
    const addresses = ADDRESSES[chain] || ADDRESSES['Ethereum'];
    this.poolAddress = addresses.pool;
    this.dataProviderAddress = addresses.dataProvider;
  }

  getName(): string {
    return `Aave V3 (${this.chain})`;
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  private getClient() {
    return getPublicClient(this.chain);
  }

  async scanGlobal(): Promise<void> {
    const client = this.getClient();
    const latestBlock = await client.getBlockNumber();
    const fromBlock = latestBlock - 10000n; // Use smaller range for multi-chain health
    await this.scanRange(fromBlock, latestBlock);
  }

  async scanIncremental(): Promise<void> {
    const client = this.getClient();
    const lastSyncedBlock = await this.db.getBlockCursor(this.getName());
    const latestBlock = await client.getBlockNumber();

    if (BigInt(lastSyncedBlock) >= latestBlock) return;

    await this.scanRange(BigInt(lastSyncedBlock) + 1n, latestBlock);
  }

  async syncAllRates(db: ILoanRepository): Promise<void> {
    console.log(`Syncing all Aave V3 rates on ${this.chain}...`);
    const client = this.getClient();
    const timestamp = Math.floor(Date.now() / 1000);

    // List of assets to check (common ones)
    const assets = [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfedF7C193bc2C599' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9eb0cE3606eb48' },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98B954EedeAC495271d0F' },
      { symbol: 'wstETH', address: '0x7f39C581F595B53c5cb19bD0b3f8DA6c935E2Ca0' }
    ];

    for (const asset of assets) {
      try {
        const rate = await this.getMarketRate(asset.address, asset.address);
        if (rate !== null) {
          // Fetch Configuration for LTV/LT
          const config = await client.readContract({
            address: this.dataProviderAddress,
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
            args: [getAddress(asset.address) as `0x${string}`],
          }) as any;

          await db.upsertRate({
            protocol: this.getName(),
            assetPair: `${asset.symbol}/${asset.symbol}`, // Simplified for Aave direct borrow
            rate: rate,
            lastUpdateTimestamp: timestamp,
            chain: this.chain,
            collateralSymbol: asset.symbol,
            debtSymbol: asset.symbol,
            isRWA: false,
            ltv: Number(config.ltv) / 10000,
            liquidationThreshold: Number(config.liquidationThreshold) / 10000,
            liquidationPenalty: (Number(config.liquidationBonus) - 10000) / 10000,
            collateralCategory: 'N/A',
            debtCategory: 'N/A',
            collateralPath: null,
            debtPath: null,
            rateType: 'floating'
          });
        }
      } catch (e) {
        // Skip silently
      }
    }
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    if (this.status.isScanning) return;
    this.status.isScanning = true;
    this.status.error = undefined;

    try {
      console.log(`[${this.getName()}] Scanning range ${fromBlock} to ${toBlock} on ${this.chain}...`);

      const events = [
        parseAbiItem('event Borrow(address indexed reserve, address user, address indexed onBehalf, uint256 amount, uint8 interestRateMode, uint256 borrowRate, uint16 indexed referralCode)'),
        parseAbiItem('event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount, bool useATokens)'),
        parseAbiItem('event Supply(address indexed reserve, address user, address indexed onBehalf, uint256 amount, uint16 indexed referralCode)'),
        parseAbiItem('event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)'),
        parseAbiItem('event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)'),
      ];

      const users = new Set<string>();
      const timestamp = Math.floor(Date.now() / 1000);

      for (const event of events) {
        const logs = await getLogsInChunks({
          address: this.poolAddress,
          event: event,
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        for (const log of logs) {
          const { user } = (log as any).args;
          if (user) users.add(user);
        }
      }

      console.log(`[${this.getName()}] Found ${users.size} active users in range.`);

      const limit = pLimit(5);
      for (const userAddress of users) {
        await limit(async () => {
          await this.syncUserPosition(userAddress, Number(toBlock), timestamp);
        });
      }

      await this.db.updateBlockCursor(this.getName(), Number(toBlock));
      this.status.lastSyncedBlock = Number(toBlock);
    } catch (error: any) {
      this.status.error = error.message;
      console.error(`[${this.getName()}] Scan range failed:`, error);
      throw error;
    } finally {
      this.status.isScanning = false;
    }
  }

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null> {
    const client = this.getClient();
    // Try Data Provider first
    try {
      const data = await client.readContract({
        address: this.dataProviderAddress,
        abi: [{
          "inputs": [{ "name": "asset", "type": "address" }],
          "name": "getReserveData",
          "outputs": [
            { "name": "unbacked", "type": "uint256" },
            { "name": "accruedToTreasuryScaled", "type": "uint256" },
            { "name": "totalAToken", "type": "uint256" },
            { "name": "totalStableDebt", "type": "uint256" },
            { "name": "totalVariableDebt", "type": "uint256" },
            { "name": "liquidityRate", "type": "uint256" },
            { "name": "variableBorrowRate", "type": "uint256" },
            { "name": "stableBorrowRate", "type": "uint256" },
            { "name": "averageStableBorrowRate", "type": "uint256" },
            { "name": "liquidityIndex", "type": "uint256" },
            { "name": "variableBorrowIndex", "type": "uint256" },
            { "name": "lastUpdateTimestamp", "type": "uint40" }
          ],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getReserveData',
        args: [getAddress(debtAsset) as `0x${string}`],
      }) as any;

      if (data && data.variableBorrowRate) {
        return Number(data.variableBorrowRate) / 1e27;
      }
      if (Array.isArray(data) && data.length > 6) {
        return Number(data[6]) / 1e27;
      }
    } catch (e) {
      // Log silently and try next
    }

    // Try Pool directly
    try {
      const poolData = await client.readContract({
        address: this.poolAddress,
        abi: [{
          "inputs": [{ "name": "asset", "type": "address" }],
          "name": "getReserveData",
          "outputs": [{
            "components": [
              { "name": "configuration", "type": "uint256" },
              { "name": "liquidityIndex", "type": "uint128" },
              { "name": "currentLiquidityRate", "type": "uint128" },
              { "name": "variableBorrowIndex", "type": "uint128" },
              { "name": "currentVariableBorrowRate", "type": "uint128" },
              { "name": "currentStableBorrowRate", "type": "uint128" },
              { "name": "lastUpdateTimestamp", "type": "uint40" },
              { "name": "id", "type": "uint16" },
              { "name": "aTokenAddress", "type": "address" },
              { "name": "stableDebtTokenAddress", "type": "address" },
              { "name": "variableDebtTokenAddress", "type": "address" },
              { "name": "interestRateStrategyAddress", "type": "address" },
              { "name": "accruedToTreasury", "type": "uint128" },
              { "name": "unbacked", "type": "uint128" },
              { "name": "isolationModeTotalDebt", "type": "uint128" }
            ],
            "name": "data",
            "type": "tuple"
          }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getReserveData',
        args: [getAddress(debtAsset) as `0x${string}`],
      }) as any;

      if (poolData && poolData.currentVariableBorrowRate) {
        return Number(poolData.currentVariableBorrowRate) / 1e27;
      }
    } catch (e: any) {
      console.warn(`[${this.getName()}] Failed both Aave rate methods for ${debtAsset} on ${this.chain}:`, e.message);
    }

    return null;
  }

  private async syncUserPosition(userAddress: string, blockNumber: number, timestamp: number) {
    const client = this.getClient();
    try {
      const userData = await client.readContract({
        address: this.poolAddress,
        abi: AAVE_POOL_ABI,
        functionName: 'getUserAccountData',
        args: [userAddress as `0x${string}`],
      }) as any;

      const hf = Number(userData.healthFactor) / 1e18;
      const ltv = Number(userData.ltv) / 10000;
      const totalColl = Number(userData.totalCollateralBase) / 1e8; 
      const totalDebt = Number(userData.totalDebtBase) / 1e8;

      if (totalColl === 0 && totalDebt === 0) return;

      await this.db.upsertPosition({
        id: `aave_${this.chain}_${userAddress}`,
        protocol: this.getName(),
        userAddress: userAddress,
        marketId: 'main',
        collateralAsset: getAddress('0x0000000000000000000000000000000000000000'), // Placeholder for agg position
        collateralSymbol: 'Aggregated (BTC/ETH)',
        collateralAmount: (totalColl * 1e18 / 2500).toString(), 
        collateralDecimals: 18,
        debtAsset: getAddress('0x0000000000000000000000000000000000000000'),
        debtSymbol: 'Aggregated (Debt)',
        debtAmount: (totalDebt * 1e6).toString(),
        debtDecimals: 6,
        healthFactor: hf > 100 ? 100 : hf,
        ltv: ltv,
        liquidationPrice: null,
        lastUpdateBlock: blockNumber,
        lastUpdateTimestamp: timestamp,
        chain: this.chain,
      });

    } catch (e) {
      console.error(`[${this.getName()}] Failed to sync user position for ${userAddress} on ${this.chain}:`, e);
    }
  }
}
