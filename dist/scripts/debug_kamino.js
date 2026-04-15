import axios from 'axios';
const KAMINO_MARKETS = [
    { id: '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF', name: 'Main' },
    { id: 'CqAoLuqWtavaVE8deBjMKe8ZfSt9ghR6Vb8nfsyabyHA', name: 'Prime' },
    { id: '47tfyEG9SsdEnUm9cw5kY9BXngQGqu3LBoop9j5uTAv8', name: 'OnRe' },
    { id: '6WEGfej9B9wjxRs6t4BYpb9iCXd8CpTpJ8fVSNzHCC5y', name: 'Maple' },
    { id: 'CF32kn7AY8X1bW7ZkGcHc4X9ZWTxqKGCJk6QwrQkDcdw', name: 'Superstate' },
    { id: '52FSGeeokLpgvgAMdqxyt5Hoc2TbUYj5b8yxrEdZ37Vf', name: 'Huma' },
    { id: '9Y7uwXgQ68mGqRtZfuFaP4hc4fxeJ7cE9zTtqTxVhfGU', name: 'Solstice' },
];
async function debugKamino() {
    for (const market of KAMINO_MARKETS) {
        const url = `https://api.kamino.finance/kamino-market/${market.id}/reserves/metrics`;
        console.log(`\n--- Fetching Market: ${market.name} ---`);
        console.log(`URL: ${url}`);
        try {
            const response = await axios.get(url, {
                headers: {
                    'Referer': 'https://kamino.com/',
                    'Origin': 'https://kamino.com',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const data = response.data;
            if (data && Array.isArray(data)) {
                console.log(`Found ${data.length} reserves.`);
                for (const reserve of data) {
                    const symbol = reserve.liquidityToken;
                    const borrowRate = reserve.borrowApy;
                    const supplyRate = reserve.supplyApy;
                    if (['PRIME', 'ONYC', 'SYRUPUSDC', 'USCC', 'PST', 'EUSX', 'SOL', 'USDC', 'USDT'].includes(symbol?.toUpperCase())) {
                        console.log(`[${symbol}] Borrow: ${borrowRate}, Supply: ${supplyRate}`);
                    }
                }
            }
            else {
                console.log('No reserves found in response.');
            }
        }
        catch (e) {
            console.error(`Error fetching ${market.name}: ${e.message}`);
        }
    }
}
debugKamino().catch(console.error);
