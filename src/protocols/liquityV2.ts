import { publicClient, getLogsInChunks, getAddress } from '../utils/rpc.js';
import { ILoanRepository, LoanPosition } from '../db/interface.js';
import { ProtocolScanner, ScannerStatus } from '../utils/types.js';
import { getAssetCategory, getAssetPath } from '../utils/assets.js';
import { parseAbiItem } from 'viem';

const COLLATERAL_REGISTRY_ADDRESS = getAddress('0xd99de73b95236f69a559117ecd6f519af780f3f7');

export class LiquityV2Scanner implements ProtocolScanner {
  public chain = 'Ethereum';
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  constructor(private db: ILoanRepository) {}

  getName(): string {
    return 'Liquity V2 (Ethereum)';
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  async scanGlobal(): Promise<void> {
    console.log('Starting global scan for Liquity V2 (Bold)...');
    this.status.isScanning = true;
    try {
      const totalCollaterals = await publicClient.readContract({
        address: COLLATERAL_REGISTRY_ADDRESS,
        abi: [parseAbiItem('function totalCollaterals() view returns (uint256)')],
        functionName: 'totalCollaterals',
      }) as bigint;

      const latestBlock = await publicClient.getBlockNumber();
      const timestamp = Math.floor(Date.now() / 1000);

      for (let i = 0n; i < totalCollaterals; i++) {
        const troveManagerAddress = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getTroveManager(uint256 _index) view returns (address)')],
          functionName: 'getTroveManager',
          args: [i],
        }) as `0x${string}`;

        const collateralToken = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getToken(uint256 _index) view returns (address)')],
          functionName: 'getToken',
          args: [i],
        }) as `0x${string}`;

        await this.scanBranch(troveManagerAddress, collateralToken, Number(latestBlock), timestamp);
      }

      await this.db.updateBlockCursor(this.getName(), Number(latestBlock));
      this.status.lastSyncedBlock = Number(latestBlock);
    } catch (error: any) {
      this.status.error = error.message;
      throw error;
    } finally {
      this.status.isScanning = false;
    }
  }

  private async scanBranch(troveManagerAddress: `0x${string}`, collateralToken: `0x${string}`, blockNumber: number, timestamp: number) {
    const sortedTrovesAddress = await publicClient.readContract({
      address: troveManagerAddress,
      abi: [parseAbiItem('function sortedTroves() view returns (address)')],
      functionName: 'sortedTroves',
    }) as `0x${string}`;

    console.log(`Scanning branch: TroveManager ${troveManagerAddress}, Collateral ${collateralToken}`);

    let currentTrove: any = await publicClient.readContract({
      address: sortedTrovesAddress,
      abi: [parseAbiItem('function getFirst() view returns (address)')],
      functionName: 'getFirst',
    });

    let count = 0;
    while (currentTrove && currentTrove !== '0x0000000000000000000000000000000000000000' && count < 10) {
      await this.syncTroveV2(troveManagerAddress, currentTrove, collateralToken, blockNumber, timestamp);
      
      try {
        currentTrove = await publicClient.readContract({
          address: sortedTrovesAddress,
          abi: [parseAbiItem('function getNext(address _id) view returns (address)')],
          functionName: 'getNext',
          args: [currentTrove],
        });
      } catch (e: any) {
        console.warn(`Failed to get next trove after ${currentTrove} on branch ${troveManagerAddress}:`, e.message);
        break;
      }
      count++;
    }
    console.log(`Branch scan completed. Found ${count} troves.`);
  }

  async scanIncremental(): Promise<void> {
    const lastSyncedBlock = await this.db.getBlockCursor(this.getName());
    const latestBlock = await publicClient.getBlockNumber();
    if (BigInt(lastSyncedBlock) >= latestBlock) return;
    await this.scanRange(BigInt(lastSyncedBlock) + 1n, latestBlock);
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    if (this.status.isScanning) return;
    this.status.isScanning = true;
    this.status.error = undefined;

    try {
      console.log(`[${this.getName()}] Scanning range ${fromBlock} to ${toBlock}...`);
      const totalCollaterals = await publicClient.readContract({
        address: COLLATERAL_REGISTRY_ADDRESS,
        abi: [parseAbiItem('function totalCollaterals() view returns (uint256)')],
        functionName: 'totalCollaterals',
      }) as bigint;

      for (let i = 0n; i < totalCollaterals; i++) {
        const troveManager = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getTroveManager(uint256 _index) view returns (address)')],
          functionName: 'getTroveManager',
          args: [i],
        }) as `0x${string}`;

        const collateralToken = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getToken(uint256 _index) view returns (address)')],
          functionName: 'getToken',
          args: [i],
        }) as `0x${string}`;

        const logs = await getLogsInChunks({
          address: troveManager,
          event: parseAbiItem('event TroveUpdated(address indexed _borrower, uint256 _debt, uint256 _coll, uint256 _stake, uint8 _operation)'),
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        for (const log of logs) {
          const { _borrower } = (log as any).args;
          if (_borrower) {
            await this.syncTroveV2(troveManager, _borrower, collateralToken, Number(toBlock), Math.floor(Date.now() / 1000));
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

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null> {
    if (!marketId) return null;
    try {
      const rate = await publicClient.readContract({
        address: marketId as `0x${string}`,
        abi: [parseAbiItem('function interestRate() view returns (uint256)')],
        functionName: 'interestRate',
      }) as bigint;
      return Number(rate) / 1e18;
    } catch (e) {
      console.error('Failed to fetch Liquity V2 rate:', e);
      return null;
    }
  }

  async syncAllRates(db: ILoanRepository): Promise<void> {
    console.log('Discovering Liquity V2 branches and rates...');
    try {
      const totalCollaterals = await publicClient.readContract({
        address: COLLATERAL_REGISTRY_ADDRESS,
        abi: [parseAbiItem('function totalCollaterals() view returns (uint256)')],
        functionName: 'totalCollaterals',
      }) as bigint;

      const timestamp = Math.floor(Date.now() / 1000);

      for (let i = 0n; i < totalCollaterals; i++) {
        const troveManager = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getTroveManager(uint256 _index) view returns (address)')],
          functionName: 'getTroveManager',
          args: [i],
        }) as `0x${string}`;

        const collateralToken = await publicClient.readContract({
          address: COLLATERAL_REGISTRY_ADDRESS,
          abi: [parseAbiItem('function getToken(uint256 _index) view returns (address)')],
          functionName: 'getToken',
          args: [i],
        }) as `0x${string}`;

        const symbol = await publicClient.readContract({
          address: collateralToken,
          abi: [parseAbiItem('function symbol() view returns (string)')],
          functionName: 'symbol',
        }) as string;

        const mcr = await publicClient.readContract({
          address: troveManager,
          abi: [parseAbiItem('function MCR() view returns (uint256)')],
          functionName: 'MCR',
        }) as bigint;

        const rate = await this.getMarketRate(collateralToken, '', troveManager);
        if (rate !== null) {
          await db.upsertRate({
            protocol: this.getName(),
            assetPair: `${symbol}/BOLD`,
            rate: rate,
            lastUpdateTimestamp: timestamp,
            chain: 'Ethereum',
            collateralSymbol: symbol,
            debtSymbol: 'BOLD',
            isRWA: false,
            ltv: (1e18 / Number(mcr)) * 0.9, // 90% of LT for safety
            liquidationThreshold: 1e18 / Number(mcr),
            liquidationPenalty: 0.10, // Liquity typically has a ~10% liquidation reserve/bonus
            collateralCategory: getAssetCategory(symbol),
            debtCategory: getAssetCategory('BOLD'),
            collateralPath: getAssetPath(symbol),
            debtPath: getAssetPath('BOLD'),
            rateType: 'fixed'
          });
          console.log(`[LIQUITY V2] Synced ${symbol}/BOLD: ${(rate * 100).toFixed(2)}%`);
          
          // Strict 1s delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      console.error('Failed to sync Liquity V2 rates:', e);
    }
  }

  private async syncTroveV2(troveManager: `0x${string}`, userAddress: string, collateralAsset: string, blockNumber: number, timestamp: number) {
    try {
      const troveData: any = await publicClient.readContract({
        address: troveManager,
        abi: [
          {
            inputs: [{ name: '_borrower', type: 'address' }],
            name: 'getLatestTroveData',
            outputs: [
              { name: 'debt', type: 'uint256' },
              { name: 'coll', type: 'uint256' },
              { name: 'status', type: 'uint8' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getLatestTroveData',
        args: [userAddress as `0x${string}`],
      });

      if (troveData.status === 1) { // 1 = open
        const collDecimals = await publicClient.readContract({
          address: collateralAsset as `0x${string}`,
          abi: [parseAbiItem('function decimals() view returns (uint8)')],
          functionName: 'decimals',
        }) as number;

        const collSymbol = await publicClient.readContract({
          address: collateralAsset as `0x${string}`,
          abi: [parseAbiItem('function symbol() view returns (string)')],
          functionName: 'symbol',
        }) as string;

        await this.db.upsertPosition({
          id: `liquityV2_${troveManager}_${userAddress}`,
          protocol: this.getName(),
          userAddress: userAddress,
          marketId: troveManager,
          collateralAsset: collateralAsset,
          collateralSymbol: collSymbol,
          collateralAmount: troveData.coll.toString(),
          collateralDecimals: collDecimals,
          debtAsset: '0x0000000000000000000000000000000000000000', 
          debtSymbol: 'BOLD',
          debtAmount: troveData.debt.toString(),
          debtDecimals: 18,
          healthFactor: null,
          ltv: null,
          liquidationPrice: null,
          lastUpdateBlock: blockNumber,
          lastUpdateTimestamp: timestamp,
          chain: 'Ethereum',
        });
      }
    } catch (e) {
      try {
        const troveInfo: any = await publicClient.readContract({
          address: troveManager,
          abi: [
            {
              inputs: [{ name: '_borrower', type: 'address' }],
              name: 'Troves',
              outputs: [
                { name: 'debt', type: 'uint256' },
                { name: 'coll', type: 'uint256' },
                { name: 'stake', type: 'uint256' },
                { name: 'status', type: 'uint8' },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'Troves',
          args: [userAddress as `0x${string}`],
        });

        if (troveInfo.status === 1) {
          const collDecimals = await publicClient.readContract({
            address: collateralAsset as `0x${string}`,
            abi: [parseAbiItem('function decimals() view returns (uint8)')],
            functionName: 'decimals',
          }) as number;

          const collSymbol = await publicClient.readContract({
            address: collateralAsset as `0x${string}`,
            abi: [parseAbiItem('function symbol() view returns (string)')],
            functionName: 'symbol',
          }) as string;

          await this.db.upsertPosition({
            id: `liquityV2_${troveManager}_${userAddress}`,
            protocol: this.getName(),
            userAddress: userAddress,
            marketId: troveManager,
            collateralAsset: collateralAsset,
            collateralSymbol: collSymbol,
            collateralAmount: troveInfo.coll.toString(),
            collateralDecimals: collDecimals,
            debtAsset: '0x0000000000000000000000000000000000000000',
            debtSymbol: 'BOLD',
            debtAmount: troveInfo.debt.toString(),
            debtDecimals: 18,
            healthFactor: null,
            ltv: null,
            liquidationPrice: null,
            lastUpdateBlock: blockNumber,
            lastUpdateTimestamp: timestamp,
            chain: 'Ethereum',
          });
        }
      } catch (e2) {
        console.error(`Failed to sync Liquity V2 position for ${userAddress} on branch ${troveManager}:`, e2);
      }
    }
  }
}
 
 
 
 
 
 
 
 
 
 
