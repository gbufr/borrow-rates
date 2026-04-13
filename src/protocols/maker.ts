import { publicClient, getLogsInChunks, getAddress } from '../utils/rpc';
import { ILoanRepository, LoanPosition } from '../db/interface';
import { ProtocolScanner, ScannerStatus } from '../utils/types';
import { parseAbiItem, hexToBytes, bytesToHex } from 'viem';

const CDP_MANAGER_ADDRESS = getAddress('0x5ef30b9986345249bc32d8928B7ee64DE9435E39');
const VAT_ADDRESS = getAddress('0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B');

export class MakerScanner implements ProtocolScanner {
  public chain = 'Ethereum';
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  constructor(private db: ILoanRepository) {}

  getName(): string {
    return 'Maker MCD (Ethereum)';
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  async scanGlobal(): Promise<void> {
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = latestBlock - 50000n; 
    await this.scanRange(fromBlock, latestBlock);
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
      const logs = await getLogsInChunks({
        address: CDP_MANAGER_ADDRESS,
        event: parseAbiItem('event NewCdp(address indexed usr, address indexed own, uint256 indexed cdp)'),
        fromBlock: fromBlock,
        toBlock: toBlock,
      });

      const timestamp = Math.floor(Date.now() / 1000);
      for (const log of logs) {
        const { cdp } = (log as any).args;
        if (cdp) {
          await this.syncMakerVault(cdp, Number(toBlock), timestamp);
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
    try {
      const JUG_ADDRESS = getAddress('0x19c0976f590D67707E62397C87829d896Dc0f1F1');
      const ilkName = marketId || 'ETH-A';
      const ilkBytes = (ilkName.startsWith('0x') ? ilkName : '0x' + Buffer.from(ilkName).toString('hex').padEnd(64, '0')) as `0x${string}`;

      const dutyData: any = await publicClient.readContract({
        address: JUG_ADDRESS,
        abi: [parseAbiItem('function ilks(bytes32) view returns (uint256 duty, uint256 rho)')],
        functionName: 'ilks',
        args: [ilkBytes],
      });

      const duty = Number(dutyData[0]) / 1e27;
      const secondsInYear = 31536000;
      const rate = Math.pow(duty, secondsInYear) - 1;
      return rate;
    } catch (e) {
      console.error('Failed to fetch Maker rate:', e);
      return null;
    }
  }

  private async syncMakerVault(cdpId: bigint, blockNumber: number, timestamp: number) {
    try {
      const urnAddress = await publicClient.readContract({
        address: CDP_MANAGER_ADDRESS,
        abi: [parseAbiItem('function urns(uint256) view returns (address)')],
        functionName: 'urns',
        args: [cdpId],
      });
      const owner = await publicClient.readContract({
        address: CDP_MANAGER_ADDRESS,
        abi: [parseAbiItem('function owns(uint256) view returns (address)')],
        functionName: 'owns',
        args: [cdpId],
      });
      const ilk = await publicClient.readContract({
        address: CDP_MANAGER_ADDRESS,
        abi: [parseAbiItem('function ilks(uint256) view returns (bytes32)')],
        functionName: 'ilks',
        args: [cdpId],
      }) as `0x${string}`;

      const [ink, art] = await publicClient.readContract({
        address: VAT_ADDRESS,
        abi: [parseAbiItem('function urns(bytes32 ilk, address urn) view returns (uint256 ink, uint256 art)')],
        functionName: 'urns',
        args: [ilk, urnAddress as `0x${string}`],
      }) as [bigint, bigint];

      if (!ink && !art) return;

      const ilkData = await publicClient.readContract({
        address: VAT_ADDRESS,
        abi: [parseAbiItem('function ilks(bytes32) view returns (uint256 Art, uint256 rate, uint256 spot, uint256 line, uint256 dust)')],
        functionName: 'ilks',
        args: [ilk],
      }) as any;

      const marketId = bytesToHex(hexToBytes(ilk)).replace(/0+$/, '');
      const symbol = marketId.split('-')[0];
      const ILK_TO_ADDRESS: Record<string, string> = {
        'ETH-A': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'ETH-B': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'WBTC-A': '0x2260FAC5E5542a773Aa44fBCfedF7C193bc2C599',
      };
      const assetAddr = ILK_TO_ADDRESS[marketId] || marketId;

      const hf = (art > 0n) ? (Number(ink) * Number(ilkData.spot)) / (Number(art) * Number(ilkData.rate)) : Infinity;
      const debtAmount = (BigInt(art) * BigInt(ilkData.rate) / 10n**27n);

      await this.db.upsertPosition({
        id: `maker_${cdpId}`,
        protocol: this.getName(),
        userAddress: owner as string,
        marketId: marketId,
        collateralAsset: assetAddr,
        collateralSymbol: symbol,
        collateralAmount: ink.toString(),
        collateralDecimals: 18,
        debtAsset: '0x6B175474E89094C44Da98B954EedeAC495271d0F',
        debtSymbol: 'DAI',
        debtAmount: debtAmount.toString(),
        debtDecimals: 18,
        healthFactor: hf === Infinity ? 100 : hf,
        ltv: null,
        liquidationPrice: null,
        lastUpdateBlock: blockNumber,
        lastUpdateTimestamp: timestamp,
        chain: 'Ethereum',
      });
    } catch (e) {
      console.error(`Failed to sync Maker vault ${cdpId}:`, e);
    }
  }
}
