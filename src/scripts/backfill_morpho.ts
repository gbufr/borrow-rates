import { getDatabaseAdapter } from '../db/index';
import { MorphoScanner } from '../protocols/morpho';
import { publicClient, getLogsInChunks } from '../utils/rpc';
import { parseAbiItem } from 'viem';
import dotenv from 'dotenv';

dotenv.config();

const MORPHO_BLUE_ADDRESS = '0xBBBBBbbBBb9cCEdAb539639EB74044813E659393';
const DEPLOYMENT_BLOCK = 18803115n;

async function main() {
  const db = await getDatabaseAdapter();
  const scanner = new MorphoScanner(db);

  const args = process.argv.slice(2);
  const fromBlockArg = args.find(a => a.startsWith('--from='))?.split('=')[1];
  const toBlockArg = args.find(a => a.startsWith('--to='))?.split('=')[1];

  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = fromBlockArg ? BigInt(fromBlockArg) : DEPLOYMENT_BLOCK;
  const toBlock = toBlockArg ? BigInt(toBlockArg) : latestBlock;

  console.log(`--- Morpho Blue Backfill Script ---`);
  console.log(`Scanning range: ${fromBlock} to ${toBlock}`);

  const events = [
    parseAbiItem('event Borrow(bytes32 indexed id, address indexed user, address indexed onBehalf, address receiver, uint256 amount, uint256 shares)'),
    parseAbiItem('event Repay(bytes32 indexed id, address indexed user, address indexed onBehalf, uint256 amount, uint256 shares)'),
    parseAbiItem('event Supply(bytes32 indexed id, address indexed user, address indexed onBehalf, uint256 amount)'),
    parseAbiItem('event Withdraw(bytes32 indexed id, address indexed user, address indexed onBehalf, address receiver, uint256 amount)'),
    parseAbiItem('event Liquidate(bytes32 indexed id, address indexed user, address indexed caller, address indexed interestRecipient, uint256 seizedAssets, uint256 repaidAssets, uint256 repaidShares, uint256 badDebtAssets, uint256 badDebtShares)'),
  ];

  const uniquePositions = new Set<string>(); // "user:marketId"

  for (const event of events) {
    console.log(`Fetching logs for event: ${(event as any).name}...`);
    const logs = await getLogsInChunks({
      address: MORPHO_BLUE_ADDRESS as `0x${string}`,
      event: event,
      fromBlock,
      toBlock,
      chunkSize: 10n, // Restrictive for Alchemy Free tier
    });

    for (const log of logs) {
      const { id, user, onBehalf } = (log as any).args;
      const targetUser = onBehalf || user;
      if (id && targetUser) {
        uniquePositions.add(`${targetUser.toLowerCase()}:${id.toLowerCase()}`);
      }
    }
  }

  console.log(`Discovered ${uniquePositions.size} unique positions. Syncing on-chain state...`);

  let count = 0;
  for (const posKey of uniquePositions) {
    const [user, marketId] = posKey.split(':');
    count++;
    if (count % 10 === 0) {
      console.log(`Progress: ${count}/${uniquePositions.size}...`);
    }
    await scanner.updatePositionFromChain(user, marketId, Number(toBlock));
  }

  await db.updateBlockCursor(scanner.getName(), Number(toBlock));
  console.log('Backfill completed successfully.');
  process.exit(0);
}

main().catch(error => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
