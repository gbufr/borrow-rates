import { publicClient } from './rpc';
import { parseAbiItem } from 'viem';
const SYMBOL_CACHE = {
    '0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110': 'USR',
    '0x8413d2a624a9fa8b6d3ec7b22cf7f62e55d6bc83': 'BONDUSD',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
};
const DECIMAL_CACHE = {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8,
};
export async function getTokenSymbol(address) {
    const addr = address.toLowerCase();
    if (SYMBOL_CACHE[addr])
        return SYMBOL_CACHE[addr];
    try {
        const symbol = await publicClient.readContract({
            address: address,
            abi: [parseAbiItem('function symbol() view returns (string)')],
            functionName: 'symbol',
        });
        SYMBOL_CACHE[addr] = symbol;
        return symbol;
    }
    catch (e) {
        return address.slice(0, 6) + '...' + address.slice(-4);
    }
}
export async function getTokenDecimals(address) {
    const addr = address.toLowerCase();
    if (DECIMAL_CACHE[addr])
        return DECIMAL_CACHE[addr];
    try {
        const decimals = await publicClient.readContract({
            address: address,
            abi: [parseAbiItem('function decimals() view returns (uint8)')],
            functionName: 'decimals',
        });
        DECIMAL_CACHE[addr] = Number(decimals);
        return Number(decimals);
    }
    catch (e) {
        return 18;
    }
}
