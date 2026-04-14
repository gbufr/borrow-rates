import { ILoanRepository } from '../db/interface.js';
import { ProtocolScanner, ScannerStatus } from '../utils/types.js';
import { getAddress } from '../utils/rpc.js';

const USDS_ADDRESS = getAddress('0xd7F9f9fDC4C615891800d333b760db126746f369');

export class SkyScanner implements ProtocolScanner {
  public chain = 'Ethereum';
  private status: ScannerStatus = {
    isScanning: false,
    lastSyncedBlock: 0,
  };

  constructor(private db: ILoanRepository) {}

  getName(): string {
    return 'Sky (Ethereum)';
  }

  getStatus(): ScannerStatus {
    return this.status;
  }

  async scanGlobal(): Promise<void> {
    console.log('Global scan for Sky (USDS) started...');
  }

  async scanIncremental(): Promise<void> {
    console.log('Incremental scan for Sky (USDS) started...');
  }

  async scanRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    console.log(`Scan range ${fromBlock} to ${toBlock} for Sky (USDS) started...`);
  }

  async getMarketRate(collateralAsset: string, debtAsset: string, marketId?: string): Promise<number | null> {
    // Sky Borrow Rate for USDS is currently around 6-7%
    return 0.065; 
  }
}
 
 
 
 
 
 
