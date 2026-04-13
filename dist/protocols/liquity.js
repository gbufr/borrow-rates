import { publicClient, getLogsInChunks, getAddress } from '../utils/rpc';
import { parseAbiItem } from 'viem';
const TROVE_MANAGER_ADDRESS = getAddress('0xA39739EFc46Aa59b77d71261b26CCEB3148ab3e4');
const SORTED_TROVES_ADDRESS = getAddress('0x8FdD3fbFEb32b28fb73555518f8b361bCeA741A6');
export class LiquityScanner {
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
        return 'Liquity V1 (Ethereum)';
    }
    async getMarketRate(collateralAsset, debtAsset, marketId) {
        // Liquity V1 has a one-time borrow fee (min 0.5%) but 0% recurring interest.
        // For a borrow rate comparison, we return 0.
        return 0;
    }
    getStatus() {
        return this.status;
    }
    async scanGlobal() {
        console.log('Starting global scan for Liquity V1...');
        const latestBlock = await publicClient.getBlockNumber();
        const timestamp = Math.floor(Date.now() / 1000);
        try {
            this.status.isScanning = true;
            let currentTrove = await publicClient.readContract({
                address: SORTED_TROVES_ADDRESS,
                abi: [parseAbiItem('function getFirst() view returns (address)')],
                functionName: 'getFirst',
            });
            let count = 0;
            while (currentTrove && currentTrove !== '0x0000000000000000000000000000000000000000' && count < 1000) {
                await this.syncTrovePosition(currentTrove, Number(latestBlock), timestamp);
                currentTrove = await publicClient.readContract({
                    address: SORTED_TROVES_ADDRESS,
                    abi: [parseAbiItem('function getNext(address _id) view returns (address)')],
                    functionName: 'getNext',
                    args: [currentTrove],
                });
                count++;
            }
            await this.db.updateBlockCursor(this.getName(), Number(latestBlock));
            this.status.lastSyncedBlock = Number(latestBlock);
        }
        catch (error) {
            this.status.error = error.message;
            throw error;
        }
        finally {
            this.status.isScanning = false;
        }
    }
    async scanIncremental() {
        const lastSyncedBlock = await this.db.getBlockCursor(this.getName());
        const latestBlock = await publicClient.getBlockNumber();
        if (BigInt(lastSyncedBlock) >= latestBlock)
            return;
        await this.scanRange(BigInt(lastSyncedBlock) + 1n, latestBlock);
    }
    async scanRange(fromBlock, toBlock) {
        if (this.status.isScanning)
            return;
        this.status.isScanning = true;
        this.status.error = undefined;
        try {
            console.log(`[${this.getName()}] Scanning range ${fromBlock} to ${toBlock}...`);
            const events = [
                parseAbiItem('event TroveUpdated(address indexed _borrower, uint256 _debt, uint256 _coll, uint256 _stake, uint8 _operation)'),
                parseAbiItem('event TroveLiquidated(address indexed _borrower, uint256 _debt, uint256 _coll, uint8 _operation)'),
            ];
            for (const event of events) {
                const logs = await getLogsInChunks({
                    address: TROVE_MANAGER_ADDRESS,
                    event: event,
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                });
                for (const log of logs) {
                    const { _borrower } = log.args;
                    if (_borrower) {
                        await this.syncTrovePosition(_borrower, Number(toBlock), Math.floor(Date.now() / 1000));
                    }
                }
            }
            await this.db.updateBlockCursor(this.getName(), Number(toBlock));
            this.status.lastSyncedBlock = Number(toBlock);
        }
        catch (error) {
            this.status.error = error.message;
            throw error;
        }
        finally {
            this.status.isScanning = false;
        }
    }
    async syncTrovePosition(userAddress, blockNumber, timestamp) {
        try {
            const status = await publicClient.readContract({
                address: TROVE_MANAGER_ADDRESS,
                abi: [parseAbiItem('function getTroveStatus(address) view returns (uint256)')],
                functionName: 'getTroveStatus',
                args: [userAddress],
            });
            const statusNum = Number(status);
            if (statusNum === 1) { // 1 = active
                console.log(`Syncing active Liquity trove for ${userAddress}...`);
                const debt = await publicClient.readContract({
                    address: TROVE_MANAGER_ADDRESS,
                    abi: [parseAbiItem('function getTroveDebt(address) view returns (uint256)')],
                    functionName: 'getTroveDebt',
                    args: [userAddress],
                });
                const coll = await publicClient.readContract({
                    address: TROVE_MANAGER_ADDRESS,
                    abi: [parseAbiItem('function getTroveColl(address) view returns (uint256)')],
                    functionName: 'getTroveColl',
                    args: [userAddress],
                });
                // Note: Prices now come from the DB during API calculation
                await this.db.upsertPosition({
                    id: `liquity_${userAddress}`,
                    protocol: this.getName(),
                    userAddress: userAddress,
                    marketId: 'main',
                    collateralAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    collateralSymbol: 'WETH',
                    collateralAmount: coll.toString(),
                    collateralDecimals: 18,
                    debtAsset: '0x5f98805A4e8be255a32880FDeC7F6728C6568bA0',
                    debtSymbol: 'LUSD',
                    debtAmount: debt.toString(),
                    debtDecimals: 18,
                    healthFactor: null, // Will be calculated by API using DB prices
                    ltv: null,
                    liquidationPrice: null,
                    lastUpdateBlock: blockNumber,
                    lastUpdateTimestamp: timestamp,
                    chain: 'Ethereum',
                });
            }
        }
        catch (e) {
            console.error(`Failed to sync Liquity position for ${userAddress}:`, e);
        }
    }
}
