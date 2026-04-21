export const CHAINS = ['All', 'Ethereum', 'Base', 'Arbitrum', 'Solana', 'Citrea'];

export const PROTOCOLS = [
  'All', 
  'Morpho Blue', 
  'Aave V3', 
  'Aave Horizon', 
  'Maker MCD', 
  'Sky', 
  'Liquity V1', 
  'Liquity V2', 
  'Moonwell', 
  'Kamino', 
  'Solend', 
  'Zentra (Citrea)'
];

export const DEBT_TOKENS = ['All', 'DAI', 'USDC', 'USDT', 'GHO', 'LUSD', 'USDS', 'BOLD', 'ctUSD'];

export const COLLATERAL_ASSETS = [
  'All', 
  'WETH', 
  'WBTC', 
  'cbBTC', 
  'wstETH', 
  'weETH', 
  'LBTC', 
  'cBTC', 
  'WcBTC', 
  'PRIME', 
  'ONYC', 
  'syrupUSDC', 
  'USCC', 
  'PST', 
  'eUSX'
];

export const TAB_TO_SLUG: Record<string, string> = {
  'DeFi Rates': 'defi',
  'CeFi Rates': 'cefi',
  'Bitcoin': 'bitcoin',
  'Optimize your position': 'volatility',
  'RWAs': 'rwas',
  'Protocols': 'protocols',
  'Insurance': 'insurance',
  'Automation': 'automation'
};

export const SLUG_TO_TAB: Record<string, string> = {
  'defi': 'DeFi Rates',
  'cefi': 'CeFi Rates',
  'bitcoin': 'Bitcoin',
  'volatility': 'Optimize your position',
  'rwas': 'RWAs',
  'rwa': 'RWAs',
  'protocols': 'Protocols',
  'insurance': 'Insurance',
  'automation': 'Automation',
  'bitcoin-rates': 'Bitcoin',
  'bitcoin-bridges': 'Bitcoin',
  'bitcoin-l2': 'Bitcoin'
};
