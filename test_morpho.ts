import { querySubgraph } from './src/utils/subgraph';
const MORPHO_API_URL = 'https://blue-api.morpho.org/graphql';

async function test() {
  const query = `
    query {
      markets(first: 1) {
        items {
          totalBorrowAssets
          totalSupplyAssets
        }
      }
    }
  `;
  try {
    const data: any = await querySubgraph(MORPHO_API_URL, query);
    console.log('Morpho Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Morpho Test Failed:', e);
  }
}
test();
