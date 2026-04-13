import { publicClient, getAddress } from './rpc';
import { parseAbiItem } from 'viem';
const ORACLES = {
    ETH: getAddress('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'),
    WBTC: getAddress('0xf47022cb55c8364c7f154024c736be21bb21a8d8'),
    DAI: getAddress('0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'),
    USDC: getAddress('0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'),
};
export const PROTOCOL_THRESHOLDS = {
    'AaveV3': 0.825,
    'MorphoBlue': 0.90,
    'LiquityV1': 0.909,
    'LiquityV2': 0.909,
    'MakerMCD': 0.66,
};
export class RiskService {
    priceCache = {
        'ETH': 2500,
        'WBTC': 65000,
        'DAI': 1.0,
        'USDC': 1.0,
        'POL': 0.45,
        'JPYC': 0.0066,
        'USDS': 1.0,
        'USR': 0.18,
        'BONDUSD': 0.21,
        'BOLD': 1.0,
        'MKGLD': 82.0, // Price per gram of Gold
        'MJPYC': 0.0066, // JPY in USD
    };
    db = null;
    constructor(db) {
        if (db)
            this.db = db;
    }
    async fetchPrices() {
        console.log('Fetching fresh prices from Chainlink...');
        const pairs = {
            'ETH': ORACLES.ETH,
            'WBTC': ORACLES.WBTC,
        };
        for (const [symbol, address] of Object.entries(pairs)) {
            try {
                const data = await publicClient.readContract({
                    address: address,
                    abi: [parseAbiItem('function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)')],
                    functionName: 'latestRoundData',
                });
                const price = Number(data[1]) / 1e8;
                this.priceCache[symbol] = price;
                console.log(`Updated ${symbol} price: $${price.toFixed(2)}`);
                if (this.db) {
                    await this.db.upsertPrice({
                        symbol,
                        price,
                        lastUpdateTimestamp: Math.floor(Date.now() / 1000)
                    });
                }
            }
            catch (e) {
                console.warn(`Oracle failed for ${symbol}: Using fallback price $${this.priceCache[symbol]}`);
            }
        }
    }
    async syncPricesFromDb() {
        if (!this.db)
            return;
        const prices = await this.db.getAllPrices();
        for (const p of prices) {
            this.priceCache[p.symbol] = p.price;
        }
        console.log(`Synced ${prices.length} prices from database.`);
    }
    calculateHealthFactor(position) {
        const collateralPrice = this.getPriceForAsset(position.collateralAsset, position.collateralSymbol);
        const debtPrice = this.getPriceForAsset(position.debtAsset, position.debtSymbol);
        const collUSD = (Number(position.collateralAmount) / Math.pow(10, position.collateralDecimals)) * collateralPrice;
        const debtUSD = (Number(position.debtAmount) / Math.pow(10, position.debtDecimals)) * debtPrice;
        if (debtUSD === 0)
            return Infinity;
        const threshold = PROTOCOL_THRESHOLDS[position.protocol] || 0.8;
        return (collUSD * threshold) / debtUSD;
    }
    getSymbolForAsset(assetAddress) {
        if (!assetAddress)
            return '???';
        const addr = assetAddress.toLowerCase();
        // Explicit mappings for specialized assets
        const MAPPINGS = {
            '0x5c275d38a23bbf2e1bc28b88093aeb60e49de8fe': 'MKGLD',
            '0xcc7b0546991e25dda448f8048a1e8e43135cbc39': 'MJPYC',
            '0x8413d2a624a9fa8b6d3ec7b22cf7f62e55d6bc83': 'BONDUSD',
            '0x66a1e37c9b0eaddca17d3662d6c05f4dedf3e110': 'USR',
            ['0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'.toLowerCase()]: 'cbBTC',
            ['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'.toLowerCase()]: 'WBTC',
            ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()]: 'WETH',
            ['0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'.toLowerCase()]: 'WBTC',
            ['0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'.toLowerCase()]: 'WETH',
        };
        if (MAPPINGS[addr])
            return MAPPINGS[addr];
        if (addr.includes('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'))
            return 'USDC';
        if (addr.includes('0x6b175474e89094c44da98b954eedeac495271d0f'))
            return 'DAI';
        if (addr.includes('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'))
            return 'wstETH';
        if (addr.includes('0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee'))
            return 'weETH';
        if (addr.includes('0x5f98805a4e8be255a32880fdec7f6728c6568ba0'))
            return 'LUSD';
        if (addr.includes('0xdc035d45d973e3ec169d2276ddab16f1e407384f'))
            return 'USDS';
        if (assetAddress.length < 10)
            return assetAddress;
        return assetAddress.slice(0, 6) + '...' + assetAddress.slice(-4);
    }
    getPriceForAsset(assetAddress, symbolHint) {
        if (symbolHint) {
            const price = this.getPriceForSymbol(symbolHint);
            if (price !== 1.0)
                return price;
        }
        if (!assetAddress)
            return 1.0;
        const symbol = this.getSymbolForAsset(assetAddress).toUpperCase();
        return this.getPriceForSymbol(symbol);
    }
    getPriceForSymbol(symbol) {
        const s = symbol.toUpperCase();
        if (s === 'ETH' || s === 'WETH')
            return this.priceCache['ETH'] || 2500;
        if (s === 'WBTC' || s === 'CBBTC')
            return this.priceCache['WBTC'] || 65000;
        if (s === 'POL' || s === 'WPOL' || s === 'MATIC')
            return this.priceCache['POL'] || 0.45;
        if (s === 'JPYC' || s === 'MJPYC')
            return this.priceCache['JPYC'] || this.priceCache['MJPYC'] || 0.0066;
        if (s === 'MKGLD')
            return this.priceCache['MKGLD'] || 82.0;
        if (s === 'USR')
            return this.priceCache['USR'] || 0.18;
        if (s === 'BONDUSD')
            return this.priceCache['BONDUSD'] || 0.21;
        if (s === 'WSTETH' || s === 'WEETH' || s === 'STETH')
            return (this.priceCache['ETH'] || 2500) * 1.25;
        const stablecoins = ['USDC', 'DAI', 'USDS', 'BOLD', 'LUSD', 'USDT', 'RLUSD'];
        if (stablecoins.includes(s))
            return 1.0;
        return 1.0;
    }
}
