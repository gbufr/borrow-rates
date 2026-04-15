export const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';

export const getGroupedAsset = (symbol: string) => {
  const ethVariants = ['WETH', 'wstETH', 'weETH', 'stETH'];
  const btcVariants = ['WBTC', 'cbBTC', 'tBTC', 'renBTC'];

  if (ethVariants.includes(symbol)) return `ETH (${symbol})`;
  if (btcVariants.includes(symbol)) return `BTC (${symbol})`;
  return symbol;
};

export const getCMCLink = (symbol: string) => {
  const slugs: Record<string, string> = {
    'WETH': 'ethereum',
    'wstETH': 'wrapped-steth',
    'weETH': 'wrapped-eeth',
    'stETH': 'staked-ether',
    'WBTC': 'wrapped-bitcoin',
    'cbBTC': 'coinbase-wrapped-btc',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'multi-collateral-dai',
    'USDS': 'usds',
    'GHO': 'gho',
    'LUSD': 'liquity-usd',
    'BOLD': 'bold',
    'sUSDe': 'ethena-staked-usde',
    'WPOL': 'wrapped-pol',
    'RLUSD': 'ripple-usd',
    'USUAL': 'usual',
    'USUALX': 'usualx',
    'syrupUSDC': 'syrupusdc',
    'USDtb': 'ethena-usdtb',
    'stUSDS': 'stusds',
    'mKGLD': 'metakgold',
    'JPYC': 'jpyc-prepaid',
    'mJPYC': 'jpyc-prepaid',
    'EURCV': 'eur-coinvertible',
    'frxUSD': 'frax-usd',
    'msUSD': 'msusd',
    'rUSD': 'rusd',
    'siUSD': 'siusd',
    'apyUSD': 'apyusd',
    'apxUSD': 'apx-usd',
    'PRIME': 'prime',
    'ONYC': 'onyc',
    'USCC': 'uscc',
    'PST': 'pst',
    'eUSX': 'mountain-protocol-usda'
  };
  const slug = slugs[symbol] || symbol.toLowerCase();
  return `https://coinmarketcap.com/currencies/${slug}/`;
};
