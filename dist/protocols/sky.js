import { getAddress } from '../utils/rpc.js';
const USDS_ADDRESS = getAddress('0xd7F9f9fDC4C615891800d333b760db126746f369');
export class SkyScanner {
    db;
    chain = 'Ethereum';
    status = {
        isScanning: false,
        lastSyncedBlock: 0,
    };
    constructor(db) {
        this.db = db;
    }
    getName() {
        return 'Sky (Ethereum)';
    }
    getStatus() {
        return this.status;
    }
    async scanGlobal() {
        console.log('Global scan for Sky (USDS) started...');
    }
    async scanIncremental() {
        console.log('Incremental scan for Sky (USDS) started...');
    }
    async scanRange(fromBlock, toBlock) {
        console.log(`Scan range ${fromBlock} to ${toBlock} for Sky (USDS) started...`);
    }
    async getMarketRate(collateralAsset, debtAsset, marketId) {
        // Sky Borrow Rate for USDS is currently around 6-7%
        return 0.065;
    }
}
