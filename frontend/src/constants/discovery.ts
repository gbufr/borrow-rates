export const PROTOCOL_DISCOVERY = [
  {
    name: 'Morpho',
    website: 'https://morpho.org',
    uniqueness: 'Layered Efficiency',
    highlights: 'Peer-to-peer matching on top of Aave/Compound. Morpho Blue enables trustless, isolated risk markets.',
    rateType: 'Floating / Adaptive',
    ltvRange: 'Up to 96.5%',
    access: 'Permissionless',
    risks: 'Isolated pool liquidity, complex vault parameters',
    chains: ['Ethereum', 'Base', 'Arbitrum']
  },
  {
    name: 'Aave V3',
    website: 'https://aave.com',
    uniqueness: 'Global Liquidity Hub',
    highlights: 'Industry standard for lending. Features E-Mode for high-LTV stablecoin loops and Portals.',
    rateType: 'Floating',
    ltvRange: 'Up to 93%',
    access: 'Permissionless',
    risks: 'Governance overhead, E-Mode collateral aggregation',
    chains: ['Ethereum', 'Base', 'Layer 2s']
  },
  {
    name: 'Maker / Sky',
    website: 'https://sky.money',
    uniqueness: 'Stablecoin Engine',
    highlights: 'The origin of DAI/USDS. Uses Collateralized Debt Positions (CDPs) with fixed stability fees.',
    rateType: 'Fixed (Gov Set)',
    ltvRange: '0% - 85%',
    access: 'Permissionless',
    risks: 'PSM liquidity reliance, centralized governance',
    chains: ['Ethereum']
  },
  {
    name: 'Liquity V1',
    website: 'https://liquity.org',
    uniqueness: 'Zero-Interest Lending',
    highlights: 'Immutable, ETH-only. Offers 0% interest loans with a one-time initiation fee.',
    rateType: 'Fixed (0%)',
    ltvRange: 'Up to 90.9%',
    access: 'Permissionless',
    risks: 'Collateral concentration (ETH only), Recovery Mode',
    chains: ['Ethereum']
  },
  {
    name: 'Liquity V2',
    website: 'https://liquity.org',
    uniqueness: 'User-Set Rates',
    highlights: 'Multi-collateral evolution. Introducing BOLD and market-driven interest rates.',
    rateType: 'Dynamic / User-Set',
    ltvRange: 'Up to 90.9%',
    access: 'Permissionless',
    risks: 'Interest rate volatility, competitive liq thresholds',
    chains: ['Ethereum']
  },
  {
    name: 'Moonwell',
    website: 'https://moonwell.fi',
    uniqueness: 'Base L3 Native',
    highlights: 'Leading lending protocol on Base and Moonbeam. Deep integration with Coinbase ecosystem.',
    rateType: 'Floating',
    ltvRange: '0% - 80%',
    access: 'Permissionless',
    risks: 'Sequencer uptime, bridge finality dependency',
    chains: ['Base', 'Optimism', 'Moonbeam']
  },
  {
    name: 'Kamino',
    website: 'https://kamino.finance',
    uniqueness: 'Solana Unified Layer',
    highlights: 'Combines lending, automated liquidity management, and leverage into a single Solana interface.',
    rateType: 'Floating',
    ltvRange: 'Up to 90%',
    access: 'Permissionless',
    risks: 'Solana network congestion, high asset monitoring',
    chains: ['Solana']
  },
  {
    name: 'Zentra',
    website: 'https://zentra.finance',
    uniqueness: 'Bitcoin ZK-Native',
    highlights: 'Native money market for Citrea (Bitcoin L2). Enables trust-minimized BTC borrowing.',
    rateType: 'Floating',
    ltvRange: 'TBD',
    access: 'Permissionless',
    risks: 'New protocol codebase, Bitcoin bridge/BitVM risk',
    chains: ['Citrea']
  },
  {
    name: 'Zharta',
    website: 'https://zharta.io',
    uniqueness: 'Fixed-Rate RWA Credit',
    highlights: 'Fixed-rate institutional credit for tokenized securities. Focused on bespoke, oracle-free lending.',
    rateType: 'Fixed / Negotiated',
    ltvRange: '80% - 90%',
    access: 'KYC Needed',
    risks: 'Counterparty default, legal enforceability risk',
    chains: ['Ethereum']
  },
  {
    name: 'Centrifuge',
    website: 'https://centrifuge.io',
    uniqueness: 'Real-World Credit Bridge',
    highlights: 'The leading RWA platform onchain. Connects businesses seeking credit with DeFi liquidity.',
    rateType: 'Variable / Pool-based',
    ltvRange: '80% - 90%',
    access: 'KYC Needed',
    risks: 'Off-chain credit risk, pool liquidity depth',
    chains: ['Centrifuge', 'Ethereum', 'Base']
  },
  {
    name: 'Maple Finance',
    website: 'https://maple.finance',
    uniqueness: 'Institutional Hub',
    highlights: 'Uncollateralized and secured credit for institutional borrowers with delegated risk management.',
    rateType: 'Bespoke / Floating',
    ltvRange: 'Variable',
    access: 'KYC Needed',
    risks: 'Underwriting quality, borrower insolvency',
    chains: ['Ethereum', 'Solana']
  },
  {
    name: 'Clearpool',
    website: 'https://clearpool.finance',
    uniqueness: 'Unsecured Credit Pools',
    highlights: 'Institutional-grade credit marketplace allowing vetted firms to borrow without crypto collateral.',
    rateType: 'Floating',
    ltvRange: 'N/A (Credit-based)',
    access: 'KYC (Prime) / Mixed',
    risks: 'Unsecured default risk, platform trust',
    chains: ['Ethereum', 'Base', 'Ozean']
  },
  {
    name: 'Goldfinch',
    website: 'https://goldfinch.finance',
    uniqueness: 'EM Credit Expansion',
    highlights: 'Bringing crypto lending to real-world businesses in emerging markets without crypto collateral.',
    rateType: 'Fixed',
    ltvRange: 'N/A (Credit-based)',
    access: 'KYC Needed',
    risks: 'Borrower default, lack of liquidation buffer',
    chains: ['Ethereum']
  },
  {
    name: 'Aave Horizon',
    website: 'https://aave.com/horizon',
    uniqueness: 'Institutional RWA Bridge',
    highlights: 'A dedicated, licensed instance of Aave enabling institutions to borrow stablecoins against tokenized RWAs like U.S. Treasuries.',
    rateType: 'Dynamic (Algorithmic)',
    ltvRange: 'Up to 85%',
    access: 'Institutional',
    risks: 'RWA valuation latency, permissioned liquidity',
    chains: ['Ethereum']
  },
  {
    name: 'Hashnote',
    website: 'https://hashnote.com',
    uniqueness: 'USYC Yield Engine',
    highlights: 'Institutional-grade investment management providing short-term yield via USYC (tokenized T-Bills) and credit strategies.',
    rateType: 'Fixed / Floating',
    ltvRange: 'Up to 90%',
    access: 'Institutional',
    risks: 'Fund management risk, regulatory changes',
    chains: ['Ethereum', 'Base']
  },
  {
    name: 'TrueFi',
    website: 'https://truefi.io',
    uniqueness: 'Uncollateralized Credit',
    highlights: 'Onchain credit marketplace connecting lenders with institutional borrowers for under-collateralized loans.',
    rateType: 'Floating',
    ltvRange: 'N/A (Credit-based)',
    access: 'Institutional (Prime)',
    risks: 'Borrower default, lack of liquid collateral',
    chains: ['Ethereum', 'Optimism']
  }
];

export const INSURANCE_DISCOVERY = [
  {
    name: 'Nexus Mutual',
    website: 'https://nexusmutual.io',
    types: 'Protocol, De-peg, ETH Staking',
    features: 'Discretionary mutual, community-governed claims, broad protocol coverage.',
    access: 'Member-based (KYC)',
    riskModel: 'Staking-based pool',
    chains: ['Ethereum', 'Multi-chain']
  },
  {
    name: 'InsurAce',
    website: 'https://insurace.io',
    types: 'Smart Contract, De-peg, IDO',
    features: 'Portfolio-based covers, high capital efficiency, 0 membership fees.',
    access: 'Permissionless',
    riskModel: 'Multi-chain liquidity',
    chains: ['Ethereum', 'Base', 'BSC', 'Polygon', 'L2s']
  },
  {
    name: 'Etherisc',
    website: 'https://etherisc.com',
    types: 'USDC De-peg, Flight Delay',
    features: 'Parametric (automated) payouts, chainlink oracle driven.',
    access: 'Permissionless',
    riskModel: 'Parametric / Algorithmic',
    chains: ['Ethereum', 'Gnosis']
  },
  {
    name: 'Risk Harbor',
    website: 'https://riskharbor.com',
    types: 'Smart Contract, De-peg',
    features: 'Algorithmic risk management, automated claims settlement.',
    access: 'Permissionless',
    riskModel: 'Transparent, code-driven',
    chains: ['Ethereum', 'Arbitrum', 'Optimism']
  },
  {
    name: 'Bridge Mutual',
    website: 'https://bridgemutual.io',
    types: 'Protocol, De-peg, CEX',
    features: 'Peer-to-peer coverage marketplace, discretionary claims.',
    access: 'Permissionless',
    riskModel: 'User-pledged capital',
    chains: ['Ethereum', 'Polygon']
  }
];

export const AUTOMATION_DISCOVERY = [
  {
    name: 'DeFi Saver',
    website: 'https://defisaver.com',
    features: 'Automation (Boost/Repay), Stop Loss, Trailing Stop, Flash-loan Rebalancing',
    protocols: ['Aave', 'Maker', 'Morpho', 'Liquity', 'Compound'],
    access: 'Permissionless',
    benefits: 'Advanced liquidation protection & algorithmic leverage management.',
    chains: ['Ethereum', 'Arbitrum', 'Optimism', 'Base']
  },
  {
    name: 'Instadapp (Lite/Avocado)',
    website: 'https://instadapp.io',
    features: 'Leverage management, Debt refinancing, Avocado Smart Wallet integration.',
    protocols: ['Aave', 'Morpho Blue', 'Maker', 'Fluid'],
    access: 'Permissionless',
    benefits: 'Seamless asset migration and cross-chain execution via Avocado.',
    chains: ['Ethereum', 'Polygn', 'Arbitrum', 'Optimism', 'Base']
  },
  {
    name: 'Summer.fi',
    website: 'https://summer.fi',
    features: 'Stop Loss, Take Profit, Constant Multiple, Trailing Stop.',
    protocols: ['Maker', 'Aave', 'Morpho Blue'],
    access: 'Permissionless',
    benefits: 'Institutional-grade automation with a focus on ease of use for retail.',
    chains: ['Ethereum', 'Arbitrum', 'Optimism']
  },
  {
    name: 'B.Protocol',
    website: 'https://bprotocol.org',
    features: 'Backstop liquidity, Liquidation protection, B.Vaults.',
    protocols: ['Liquity', 'Morpho Blue', 'Aave'],
    access: 'Permissionless',
    benefits: 'Passive liquidation protection and shared stability pool yield.',
    chains: ['Ethereum', 'Base', 'ZkSync']
  },
  {
    name: 'Brahma',
    website: 'https://brahma.fi',
    features: 'Institutional risk management, delegated execution, yield optimization.',
    protocols: ['Aave', 'Morpho', 'Pendle'],
    access: 'Institutional (Prime)',
    benefits: 'Compliant and secure automation for high-net-worth and institutions.',
    chains: ['Ethereum', 'Arbitrum', 'Base']
  },
  {
    name: 'Enso',
    website: 'https://enso.finance',
    features: 'Unified interaction layer, rebalancing, bundling/batching.',
    protocols: ['All Major Protocols'],
    access: 'Permissionless',
    benefits: 'Low-cost bundling of complex transactions and easy rebalancing.',
    chains: ['Ethereum', 'Base', 'L2s']
  }
];
