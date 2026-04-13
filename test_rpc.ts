import { createPublicClient, http, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import dotenv from 'dotenv';
dotenv.config();

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL),
});

async function test() {
  const UI_POOL_DATA_PROVIDER = '0x69529987FA4A075D0C00B0228fb1e36d4EE967AF';
  const POOL_ADDRESS_PROVIDER = '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e';
  const WHALE = '0xBE0eB53F46cd733E13263fca0ac593eEf9F99781';

  try {
    const block = await client.getBlockNumber();
    console.log('Current block:', block);

    const data = await client.readContract({
      address: UI_POOL_DATA_PROVIDER,
      abi: [
        {
          inputs: [
            { name: 'poolAddressProvider', type: 'address' },
            { name: 'user', type: 'address' },
          ],
          name: 'getUserReservesData',
          outputs: [{ components: [{ name: 'underlyingAsset', type: 'address' }], name: '', type: 'tuple[]' }, { name: 'userConfig', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'getUserReservesData',
      args: [POOL_ADDRESS_PROVIDER, WHALE],
    });
    console.log('Aave Data:', JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (e) {
    console.error('Aave Test Failed:', e);
  }
}

test();
