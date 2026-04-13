import { getPublicClient } from '../utils/rpc';
import { querySubgraph } from '../utils/subgraph';
import { ILoanRepository, LoanPosition } from '../db/interface';
import { ProtocolScanner, ScannerStatus } from '../utils/types';
import { getAssetCategory, getAssetPath } from '../utils/assets';
import { parseAbiItem, formatUnits, erc20Abi } from 'viem';

const MORPHO_BLUE_ADDRESS = '0xBBBBBbbBBb9cCEdAb539639EB74044813E659393';
const MORPHO_API_URL = 'https://blue-api.morpho.org/graphql';

const CHAIN_IDS: Record<string, number> = {
  'Ethereum': 1,
  'Base': 8453,
  'Arbitrum': 42161,
};

const MORPHO_BLUE_ABI = [
  parseAbiItem('function position(bytes32 id, address user) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)'),
  parseAbiItem('function market(bytes32 id) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)'),
  parseAbiItem('function idToMarketParams(bytes32 id) view returns (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)'),
];

export class MorphoScanner implements ProtocolScanner {
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  private marketCache: Map<string, any> = new Map();
  private tokenCache: Map<string, { symbol: string; decimals: number }> = new Map();
  private chainId: number;

  constructor(private db: ILoanRepository, public chain: string = 'Ethereum') {
    this.chainId = CHAIN_IDS[chain] || 1;
  }

  getName(): string {
    return `Morpho Blue (${this.chain})`;
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  private getClient() {
    return getPublicClient(this.chain);
  }

  async scanGlobal(): Promise<void> {
    console.log(`Starting global scan for Morpho Blue on ${this.chain}...`);
    
    const query = `
      query GetMarketPositions($chainId: Int!) {
        marketPositions(where: { chainId_in: [$chainId] }, first: 100, orderBy: BorrowShares, orderDirection: Desc) {
          items {
            user {
              address
            }
            market {
              uniqueKey
            }
          }
        }
      }
    `;

    try {
      const data: any = await querySubgraph(MORPHO_API_URL, query, { chainId: this.chainId });
      const client = this.getClient();
      const latestBlock = await client.getBlockNumber();
      
      console.log(`Found ${data.marketPositions.items.length} top positions via Morpho API on ${this.chain}. Syncing...`);
      
      for (const item of data.marketPositions.items) {
        await this.updatePositionFromChain(item.user.address, item.market.uniqueKey, Number(latestBlock));
      }

      await this.db.updateBlockCursor(this.getName(), Number(latestBlock));
    } catch (e) {
      console.error(`Failed Morpho global scan on ${this.chain}:`, e);
    }
  }

  async scanIncremental(): Promise<void> {
    const client = this.getClient();
    const lastSyncedBlock = await this.db.getBlockCursor(this.getName());
    const latestBlock = await client.getBlockNumber();

    if (BigInt(lastSyncedBlock) >= latestBlock) return;
    await this.scanRange(BigInt(lastSyncedBlock) + 1n, latestBlock);
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    if (this.status.isScanning) return;
    this.status.isScanning = true;
    this.status.error = undefined;

    const client = this.getClient();
    try {
      console.log(`[${this.getName()}] Scanning range ${fromBlock} to ${toBlock} on ${this.chain}...`);
      const events = [
        parseAbiItem('event Borrow(bytes32 indexed id, address indexed user, address indexed onBehalf, address receiver, uint256 amount, uint256 shares)'),
        parseAbiItem('event Repay(bytes32 indexed id, address indexed user, address indexed onBehalf, uint256 amount, uint256 shares)'),
        parseAbiItem('event Supply(bytes32 indexed id, address indexed user, address indexed onBehalf, uint256 amount)'),
        parseAbiItem('event Withdraw(bytes32 indexed id, address indexed user, address indexed onBehalf, address receiver, uint256 amount)'),
        parseAbiItem('event Liquidate(bytes32 indexed id, address indexed user, address indexed caller, address indexed interestRecipient, uint256 seizedAssets, uint256 repaidAssets, uint256 repaidShares, uint256 badDebtAssets, uint256 badDebtShares)'),
      ];

      for (const event of events) {
        const logs = await client.getLogs({
          address: MORPHO_BLUE_ADDRESS as `0x${string}`,
          event: event,
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        for (const log of logs) {
          const { id, user, onBehalf } = log.args as any;
          const targetUser = onBehalf || user;
          if (id && targetUser) {
            await this.updatePositionFromChain(targetUser, id, Number(toBlock));
          }
        }
      }

      await this.db.updateBlockCursor(this.getName(), Number(toBlock));
      this.status.lastSyncedBlock = Number(toBlock);
    } catch (error: any) {
      this.status.error = error.message;
      throw error;
    } finally {
      this.status.isScanning = false;
    }
  }

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId: string): Promise<number | null> {
    try {
      const query = `
        query GetMarketRate($id: String!, $chainId: Int!) {
          market(id: $id, chainId: $chainId) {
            state {
              borrowApy
            }
          }
        }
      `;
      const data: any = await querySubgraph(MORPHO_API_URL, query, { id: marketId, chainId: this.chainId });
      if (data.market && data.market.state && data.market.state.borrowApy) {
        return Number(data.market.state.borrowApy);
      }
      return null;
    } catch (e) {
      console.error(`Failed to fetch Morpho rate on ${this.chain}:`, e);
      return null;
    }
  }

  async syncAllRates(db: ILoanRepository): Promise<void> {
    console.log(`Discovering all popular Morpho Blue markets on ${this.chain}...`);
    try {
      const query = `
        query GetTopMarkets($chainId: Int!) {
          markets(where: { chainId_in: [$chainId] }, first: 20, orderBy: BorrowAssets, orderDirection: Desc) {
            items {
              uniqueKey
              lltv
              collateralAsset {
                symbol
              }
              loanAsset {
                symbol
              }
              state {
                borrowApy
              }
            }
          }
        }
      `;
      const data: any = await querySubgraph(MORPHO_API_URL, query, { chainId: this.chainId });
      const timestamp = Math.floor(Date.now() / 1000);

      for (const item of data.markets.items) {
        if (item.state && item.state.borrowApy) {
          const annualRate = Number(item.state.borrowApy);
          if (annualRate > 10) continue;

          const collateralSymbol = item.collateralAsset?.symbol || '???';
          const debtSymbol = item.loanAsset?.symbol || '???';

          await db.upsertRate({
            protocol: this.getName(),
            assetPair: `${collateralSymbol}/${debtSymbol}`,
            rate: annualRate,
            lastUpdateTimestamp: timestamp,
            chain: this.chain,
            collateralSymbol: collateralSymbol,
            debtSymbol: debtSymbol,
            ltv: item.lltv ? (Number(formatUnits(BigInt(item.lltv), 18)) * 0.9) : null, // 90% of LLTV for safety
            liquidationThreshold: item.lltv ? Number(formatUnits(BigInt(item.lltv), 18)) : null,
            liquidationPenalty: 0.05, // Morpho standard liquidator bonus is usually 5%
            collateralCategory: getAssetCategory(collateralSymbol),
            debtCategory: getAssetCategory(debtSymbol),
            collateralPath: getAssetPath(collateralSymbol),
            debtPath: getAssetPath(debtSymbol)
          });
        }
      }
    } catch (e) {
      console.error(`Failed to sync Morpho rates on ${this.chain}:`, e);
    }
  }

  public async updatePositionFromChain(user: string, marketId: string, blockNumber: number) {
    const client = this.getClient();
    try {
      const [supplyShares, borrowShares, collateral] = await client.readContract({
        address: MORPHO_BLUE_ADDRESS as `0x${string}`,
        abi: MORPHO_BLUE_ABI,
        functionName: 'position',
        args: [marketId as `0x${string}`, user as `0x${string}`],
      }) as [bigint, bigint, bigint];

      if (collateral === 0n && borrowShares === 0n) return;

      let params = this.marketCache.get(marketId);
      if (!params) {
        const [loanToken, collateralToken, oracle, irm, lltv] = await client.readContract({
          address: MORPHO_BLUE_ADDRESS as `0x${string}`,
          abi: MORPHO_BLUE_ABI,
          functionName: 'idToMarketParams',
          args: [marketId as `0x${string}`],
        }) as [string, string, string, string, bigint];
        
        params = { loanToken, collateralToken, oracle, irm, lltv };
        this.marketCache.set(marketId, params);
      }

      const [totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares] = await client.readContract({
        address: MORPHO_BLUE_ADDRESS as `0x${string}`,
        abi: MORPHO_BLUE_ABI,
        functionName: 'market',
        args: [marketId as `0x${string}`],
      }) as [bigint, bigint, bigint, bigint, bigint, bigint];

      const borrowAssets = totalBorrowShares > 0n 
        ? (borrowShares * totalBorrowAssets) / totalBorrowShares 
        : 0n;

      const loanMeta = await this.getTokenMeta(params.loanToken);
      const collMeta = await this.getTokenMeta(params.collateralToken);

      await this.db.upsertPosition({
        id: `morpho_${this.chain}_${user}_${marketId}`,
        protocol: this.getName(),
        userAddress: user,
        marketId: marketId,
        collateralAsset: params.collateralToken,
        collateralSymbol: collMeta.symbol,
        collateralAmount: collateral.toString(),
        collateralDecimals: collMeta.decimals,
        debtAsset: params.loanToken,
        debtSymbol: loanMeta.symbol,
        debtAmount: borrowAssets.toString(),
        debtDecimals: loanMeta.decimals,
        healthFactor: null,
        ltv: Number(formatUnits(params.lltv, 18)),
        liquidationPrice: null,
        lastUpdateBlock: blockNumber,
        lastUpdateTimestamp: Math.floor(Date.now() / 1000),
        chain: this.chain,
      });
    } catch (e) {
      console.error(`Failed to sync Morpho position for ${user} on ${this.chain}:`, e);
    }
  }

  private async getTokenMeta(address: string) {
    const cached = this.tokenCache.get(address);
    if (cached) return cached;

    const client = this.getClient();
    try {
      const symbol = await client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'symbol',
      });
      const decimals = await client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      });

      const meta = { symbol: symbol as string, decimals: decimals as number };
      this.tokenCache.set(address, meta);
      return meta;
    } catch (e) {
      return { symbol: '???', decimals: 18 };
    }
  }
}
