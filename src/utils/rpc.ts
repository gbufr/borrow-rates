import { createPublicClient, http, getAddress, type Log, type AbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

import { base, arbitrum } from 'viem/chains';

dotenv.config();

const ALCHEMY_KEY = process.env.RPC_URL?.split('/v2/')[1] || '';

export const clients: Record<string, any> = {
  'Ethereum': createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL),
  }),
  'Base': createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  }),
  'Arbitrum': createPublicClient({
    chain: arbitrum,
    transport: http(`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  }),
};

export function getPublicClient(chain: string = 'Ethereum') {
  return clients[chain] || clients['Ethereum'];
}

// Legacy export for compatibility
export const publicClient = clients['Ethereum'];

export async function getLogsInChunks(params: {
  address: `0x${string}`;
  event: AbiItem;
  fromBlock: bigint;
  toBlock: bigint;
  chunkSize?: bigint;
}): Promise<Log[]> {
  const { address, event, fromBlock, toBlock, chunkSize = 10n } = params; // Default 10 for Alchemy Free tier
  let allLogs: Log[] = [];
  let currentBlock = fromBlock;

  while (currentBlock <= toBlock) {
    const endBlock = currentBlock + chunkSize - 1n > toBlock ? toBlock : currentBlock + chunkSize - 1n;
    console.log(`Fetching logs from ${currentBlock} to ${endBlock}...`);
    const logs = await publicClient.getLogs({
      address,
      event: event as any,
      fromBlock: currentBlock,
      toBlock: endBlock,
    });
    allLogs = [...allLogs, ...logs];
    currentBlock = endBlock + 1n;
    
    // Add a small delay to avoid hitting rate limits on Free tier
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allLogs;
}

export { getAddress };
