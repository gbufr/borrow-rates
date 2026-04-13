import { createPublicClient, http, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';
dotenv.config();

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL),
});

async function test() {
  const POOL_ADDRESS = '0x87870B2eC3AcdbfD0DD2072F2Fe2E116001f9560';

  try {
    const data = await client.readContract({
      address: POOL_ADDRESS,
      abi: [parseAbiItem('function ADDRESSES_PROVIDER() view returns (address)')],
      functionName: 'ADDRESSES_PROVIDER',
    });
    console.log('Aave Provider:', data);
  } catch (e) {
    console.error('Aave Simple Test Failed:', e);
  }
}

test();
