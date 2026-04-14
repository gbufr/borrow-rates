import { ProtocolScanner, ScannerStatus } from './types.js';
import { ILoanRepository } from '../db/interface.js';
import { publicClient } from './rpc.js';
import pLimit from 'p-limit';

export interface SyncConfig {
  protocols: ProtocolScanner[];
  db: ILoanRepository;
  pollIntervalMs: number;
  concurrencyLimit: number;
}

export class SyncOrchestrator {
  private protocols: ProtocolScanner[];
  private db: ILoanRepository;
  private pollIntervalMs: number;
  private limit: any;
  private isRunning: boolean = false;

  constructor(config: SyncConfig) {
    this.protocols = config.protocols;
    this.db = config.db;
    this.pollIntervalMs = config.pollIntervalMs;
    this.limit = pLimit(config.concurrencyLimit);
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('Sync Orchestrator started.');

    while (this.isRunning) {
      try {
        await this.runSyncCycle();
      } catch (error) {
        console.error('Error in sync cycle:', error);
      }
      console.log(`Waiting ${this.pollIntervalMs / 1000}s for next cycle...`);
      await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  stop() {
    this.isRunning = false;
    console.log('Sync Orchestrator stopped.');
  }

  async runSyncCycle() {
    console.log('Starting sync cycle...');
    const latestBlock = await publicClient.getBlockNumber();

    const tasks = this.protocols.map(protocol => 
      this.limit(async () => {
        try {
          const lastSyncedBlock = await this.db.getBlockCursor(protocol.getName());
          
          if (lastSyncedBlock === 0) {
            console.log(`[${protocol.getName()}] No cursor found. Starting historical backfill...`);
            await protocol.scanGlobal();
          } else {
            console.log(`[${protocol.getName()}] Syncing from protocol logic (incremental or range)...`);
            await protocol.scanIncremental();
          }
        } catch (error) {
          console.error(`[${protocol.getName()}] Sync failed:`, error);
        }
      })
    );

    await Promise.all(tasks);
    console.log('Sync cycle completed.');
  }

  async backfill(protocolName?: string, fromBlock?: bigint) {
    const targets = protocolName 
      ? this.protocols.filter(p => p.getName() === protocolName)
      : this.protocols;

    for (const protocol of targets) {
      console.log(`[${protocol.getName()}] Starting targeted backfill...`);
      if (fromBlock !== undefined) {
        const toBlock = await publicClient.getBlockNumber();
        await protocol.scanRange(fromBlock, toBlock);
      } else {
        await protocol.scanGlobal();
      }
    }
  }

  getStatus(): Record<string, ScannerStatus> {
    const status: Record<string, ScannerStatus> = {};
    for (const protocol of this.protocols) {
      status[protocol.getName()] = protocol.getStatus();
    }
    return status;
  }
}
