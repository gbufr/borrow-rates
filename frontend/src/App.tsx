import { useState, useEffect } from 'react';
import { 
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface MarketRate {
  protocol: string;
  assetPair: string;
  rate: number;
  lastUpdateTimestamp: number;
  chain: string;
  collateralSymbol: string;
  debtSymbol: string;
  isRWA?: boolean;
  ltv: number | null;
  liquidationThreshold: number | null;
  liquidationPenalty: number | null;
  collateralCategory: string;
  debtCategory: string;
  collateralPath: string | null;
  debtPath: string | null;
  rateType: 'fixed' | 'floating';
}

function App() {
  const [protocol, setProtocol] = useState<string>('All');
  const [debtToken, setDebtToken] = useState<string>('All');
  const [collateralAsset, setCollateralAsset] = useState<string>('All');
  const [chain, setChain] = useState('All');
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rateTypeFilter, setRateTypeFilter] = useState<'All' | 'fixed' | 'floating'>('All');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const chains = ['All', 'Ethereum', 'Base', 'Arbitrum', 'Solana', 'Citrea'];
  const protocols = ['All', 'Morpho Blue', 'Aave V3', 'Maker MCD', 'Sky', 'Liquity V1', 'Liquity V2', 'Moonwell', 'Kamino', 'Solend', 'Zentra (Citrea)'];
  const debtTokens = ['All', 'DAI', 'USDC', 'USDT', 'GHO', 'LUSD', 'USDS', 'BOLD', 'ctUSD'];
  const collateralAssets = ['All', 'WETH', 'WBTC', 'cbBTC', 'wstETH', 'weETH', 'LBTC', 'cBTC', 'WcBTC'];

  const tabToSlug: Record<string, string> = {
    'DeFi Rates': 'defi',
    'CeFi Rates': 'cefi',
    'Bitcoin': 'bitcoin',
    'RWAs': 'rwas',
    'Protocols': 'protocols'
  };

  const slugToTab: Record<string, string> = {
    'defi': 'DeFi Rates',
    'cefi': 'CeFi Rates',
    'bitcoin': 'Bitcoin',
    'rwas': 'RWAs',
    'rwa': 'RWAs',
    'protocols': 'Protocols'
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return slugToTab[hash] || 'DeFi Rates';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const tab = slugToTab[hash];
      if (tab) {
        setActiveTab(tab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const slug = tabToSlug[activeTab];
    if (slug) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== slug) {
        window.history.replaceState(null, '', `#${slug}`);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [protocol, debtToken, chain, collateralAsset]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (protocol !== 'All') q.append('protocol', protocol);
      if (debtToken !== 'All') q.append('debtToken', debtToken);
      if (collateralAsset !== 'All') q.append('collateralAsset', collateralAsset);
      if (chain !== 'All') q.append('chain', chain);
      
      const res = await fetch(`${API_BASE}/rates?${q.toString()}`);
      const data = await res.json();
      setRates(data);
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';

  const getGroupedAsset = (symbol: string) => {
    const ethVariants = ['WETH', 'wstETH', 'weETH', 'stETH'];
    const btcVariants = ['WBTC', 'cbBTC', 'tBTC', 'renBTC'];

    if (ethVariants.includes(symbol)) return `ETH (${symbol})`;
    if (btcVariants.includes(symbol)) return `BTC (${symbol})`;
    return symbol;
  };

  const getCMCLink = (symbol: string) => {
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
      'apxUSD': 'apx-usd'
    };
    const slug = slugs[symbol] || symbol.toLowerCase();
    return `https://coinmarketcap.com/currencies/${slug}/`;
  };

  const FilterDropdown = ({ title, options, current, onSelect, onClose }: { 
    title: string, 
    options: string[], 
    current: string, 
    onSelect: (v: string) => void,
    onClose: () => void 
  }) => (
    <div className="filter-dropdown" style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      background: '#111827', // Solid dark background for readability
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '0.6rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
      zIndex: 100,
      minWidth: '160px',
      padding: '0.5rem',
      marginTop: '0.5rem',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{title}</span>
        <X size={12} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onClose(); }} />
      </div>
      <div className="filter-options-list" style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {options.map(opt => (
          <button
            key={opt}
            className={current === opt ? 'selected' : ''}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
            style={{
              padding: '0.5rem 0.75rem',
              textAlign: 'left',
              background: current === opt ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
              color: current === opt ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '0.4rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: current === opt ? 600 : 400,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {opt.replace('MCD', '').replace('Blue', '')}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="header">
        <img src="/logo.png" alt="Logo" className="brand-logo" />
        <div className="title-group">
          <h1>borrow-rates.org</h1>
          <p>Live Borrow Rates across various markets</p>
        </div>
      </header>

      <nav className="tab-nav" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', padding: '0 0.5rem', flexWrap: 'wrap' }}>
        {['DeFi Rates', 'CeFi Rates', 'Bitcoin', 'RWAs', 'Protocols'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.75rem 0',
              borderBottom: activeTab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
          >
            {t}
          </button>
        ))}
        

      </nav>




      {activeTab === 'CeFi Rates' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }}>🏦</span> CeFi Borrow Rates
              </h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Collateral</th>
                    <th>Debt</th>
                    <th>Rate (APR)</th>
                    <th>Max LTV</th>
                    <th>Liquidation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Coinbase</td>
                    <td>BTC (Native)</td>
                    <td>USDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.75%</td>
                    <td>75%</td>
                    <td>86%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Binance</td>
                    <td>BTC (Native)</td>
                    <td>USDT</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Variable (5-12%)</td>
                    <td>80%</td>
                    <td>90%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Crypto.com</td>
                    <td>BTC (Native)</td>
                    <td>USDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.00%</td>
                    <td>50%</td>
                    <td>75%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Nexo</td>
                    <td>BTC (Native)</td>
                    <td>USDT/USDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~7.9% - 13.9%</td>
                    <td>50%</td>
                    <td>83.33%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
            *Rates are estimated based on latest market data. CeFi platforms often require KYC and involve custody risk.
          </p>
        </main>
      )}

      {activeTab === 'RWAs' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#ec4899', fontSize: '1.4rem' }}>🏛️</span> Real World Asset (RWA) Markets
              </h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Protocol</th>
                    <th>RWA Collateral</th>
                    <th>Debt Asset</th>
                    <th>Borrow Rate</th>
                    <th>Max LTV</th>
                    <th>Liq. Threshold</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Morpho</td>
                    <td style={{ fontWeight: 600 }}>
                      <a href="https://www.blackrock.com/us/individual/products/335207/blackrock-usd-institutional-digital-liquidity-fund" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>BUIDL (BlackRock)</a>
                    </td>
                    <td>USDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.20%</td>
                    <td>80%</td>
                    <td>86%</td>
                    <td><span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', fontSize: '10px' }}>KYC Required</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Aave (Horizon)</td>
                    <td style={{ fontWeight: 600 }}>
                      <a href="https://coinmarketcap.com/currencies/ondo-ousg/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Ondo OUSG</a>
                    </td>
                    <td>GHO</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.50%</td>
                    <td>85%</td>
                    <td>90%</td>
                    <td><span className="badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid #ec4899', fontSize: '10px' }}>Institutional</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Flux Finance</td>
                    <td style={{ fontWeight: 600 }}>
                      <a href="https://coinmarketcap.com/currencies/ondo-usdy/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Ondo USDY</a>
                    </td>
                    <td>fUSDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.85%</td>
                    <td>85%</td>
                    <td>92%</td>
                    <td><span className="badge" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid #34d399', fontSize: '10px' }}>Permissionless</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Morpho</td>
                    <td style={{ fontWeight: 600 }}>
                      <a href="https://superstate.co/ustb" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Superstate USTB</a>
                    </td>
                    <td>USDC</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.15%</td>
                    <td>90%</td>
                    <td>94.5%</td>
                    <td><span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', fontSize: '10px' }}>KYC Required</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '1rem', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#ec4899' }}>About RWA Collateral</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Real-World Assets like tokenized US Treasuries provide a low-volatility alternative to crypto assets. 
              While many require KYC, they allow for higher LTVs (up to 90%) and are increasingly used for "yield looping" strategies.
            </p>
          </div>
        </main>
      )}
      {(activeTab === 'DeFi Rates' || activeTab === 'Bitcoin') && (
        <div className="tab-content-wrapper">


          {loading ? (
            <div className="loading">Syncing with on-chain data...</div>
          ) : (
            <main className="section-content">
              <div className="card">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0 }}>
                    {activeTab === 'Bitcoin' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#f7931a', fontSize: '1.4rem' }}>₿</span> Bridged & Native BTC Borrow Rates
                      </span>
                    ) : (
                      "Live Borrow Rates in various markets"
                    )}
                  </h2>
                  <div className="search-container" style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Search asset..." 
                      className="search-input"
                      style={{ padding: '0.4rem 0.8rem 0.4rem 2.2rem', fontSize: '0.85rem', width: '200px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '0.4rem', color: 'var(--text-primary)' }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'chain' ? null : 'chain')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Chain <ChevronDown size={12} style={{ opacity: chain !== 'All' ? 1 : 0.5, color: chain !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                          </div>
                          {activeFilter === 'chain' && (
                            <FilterDropdown title="Chain" options={chains} current={chain} onSelect={setChain} onClose={() => setActiveFilter(null)} />
                          )}
                        </th>
                        <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'protocol' ? null : 'protocol')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Protocol <ChevronDown size={12} style={{ opacity: protocol !== 'All' ? 1 : 0.5, color: protocol !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                          </div>
                          {activeFilter === 'protocol' && (
                            <FilterDropdown title="Protocol" options={protocols} current={protocol} onSelect={setProtocol} onClose={() => setActiveFilter(null)} />
                          )}
                        </th>
                        <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'collateral' ? null : 'collateral')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Collateral <ChevronDown size={12} style={{ opacity: collateralAsset !== 'All' ? 1 : 0.5, color: collateralAsset !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                          </div>
                          {activeFilter === 'collateral' && (
                            <FilterDropdown title="Collateral" options={collateralAssets} current={collateralAsset} onSelect={setCollateralAsset} onClose={() => setActiveFilter(null)} />
                          )}
                        </th>
                        <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'debt' ? null : 'debt')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Debt <ChevronDown size={12} style={{ opacity: debtToken !== 'All' ? 1 : 0.5, color: debtToken !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                          </div>
                          {activeFilter === 'debt' && (
                            <FilterDropdown title="Debt Token" options={debtTokens} current={debtToken} onSelect={setDebtToken} onClose={() => setActiveFilter(null)} />
                          )}
                        </th>
                        <th>Borrow rate</th>
                        <th>LTV</th>
                        <th>Liq. Threshold</th>
                        <th>Liq. Penalty</th>
                        <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'rateType' ? null : 'rateType')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Rate Type <ChevronDown size={12} style={{ opacity: rateTypeFilter !== 'All' ? 1 : 0.5, color: rateTypeFilter !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                          </div>
                          {activeFilter === 'rateType' && (
                            <FilterDropdown title="Rate Type" options={['All', 'fixed', 'floating']} current={rateTypeFilter} onSelect={(v) => setRateTypeFilter(v as any)} onClose={() => setActiveFilter(null)} />
                          )}
                        </th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates
                        .filter(r => {
                          const matchesSearch = !search || r.assetPair.toLowerCase().includes(search.toLowerCase()) || r.protocol.toLowerCase().includes(search.toLowerCase());
                          const matchesProtocol = protocol === 'All' || r.protocol.includes(protocol);
                          const matchesChain = chain === 'All' || r.chain === chain;
                          const matchesCollateral = collateralAsset === 'All' || r.collateralSymbol === collateralAsset;
                          const matchesDebt = debtToken === 'All' || r.debtSymbol === debtToken;
                          const matchesCategory = activeTab === 'Bitcoin' ? r.collateralCategory === 'BTC' : true;
                          const matchesRateType = rateTypeFilter === 'All' || r.rateType === rateTypeFilter;
                          return matchesSearch && matchesProtocol && matchesChain && matchesCollateral && matchesDebt && matchesCategory && matchesRateType;
                        })
                        .sort((a, b) => {
                          const categoryPriority: Record<string, number> = {
                            'BTC': 1,
                            'GOLD': 2,
                            'ETH': 3,
                            'OTHER': 4,
                            'EUR': 5,
                            'JPY': 6,
                            'USD': 10,
                          };
                          const pA = categoryPriority[a.collateralCategory] || 99;
                          const pB = categoryPriority[b.collateralCategory] || 99;
                          if (pA !== pB) return pA - pB;
                          return a.protocol.localeCompare(b.protocol);
                        })
                        .map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{r.chain}</td>
                          <td style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {r.protocol.replace('MCD', '').replace('Blue', '')}
                              {!!r.isRWA && <span className="badge" style={{ background: 'var(--rwa-magenta)', color: '#fff', fontSize: '9px', padding: '1px 4px' }}>RWA</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <a 
                                href={getCMCLink(r.collateralSymbol)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="asset-link"
                                style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}
                              >
                                {getGroupedAsset(r.collateralSymbol)}
                              </a>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                Pegged to {r.collateralCategory}
                              </span>

                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <a 
                                href={getCMCLink(r.debtSymbol)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="asset-link"
                                style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}
                              >
                                {r.debtSymbol}
                              </a>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                Pegged to {r.debtCategory}
                              </span>

                            </div>
                          </td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{formatPercent(r.rate)}</td>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {r.ltv ? (r.ltv * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {r.liquidationThreshold ? (r.liquidationThreshold * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td style={{ color: '#ef4444', fontWeight: 600 }}>
                            {r.liquidationPenalty ? (r.liquidationPenalty * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              color: r.rateType === 'fixed' ? '#34d399' : '#60a5fa',
                              textTransform: 'capitalize'
                            }}>
                              {r.rateType || 'Floating'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {Math.floor((Date.now() / 1000 - r.lastUpdateTimestamp) / 60)}m ago
                            </span>
                          </td>
                        </tr>
                      ))}
                      {rates.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            No rates data found. Run a scan to populate.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {activeTab === 'Bitcoin' && (
                  <div style={{ padding: '2rem', marginTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Bitcoin Native Ecosystem</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem' }}>
                      <div className="discovery-box" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span style={{ color: '#f7931a' }}>₿</span> Babylon TBV
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                          Non-custodial infrastructure for native Bitcoin staking and collateralization using BitVM and ZKPs.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Available Borrow:</div>
                          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', listStyle: 'none', padding: 0 }}>
                            <li>• Lombard (LBTC) on Morpho/Moonwell</li>
                            <li>• Solv (xSolvBTC) on Various Chains</li>
                            <li>• Aave V4 Native Spoke (April 2026)</li>
                          </ul>
                        </div>
                      </div>

                      <div className="discovery-box" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span style={{ color: '#22d3ee' }}>⚡</span> Citrea ZK-Rollup
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                          The first ZK-rollup on Bitcoin, settling with BitVM-based trust-minimized verification.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Available Borrow:</div>
                          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', listStyle: 'none', padding: 0 }}>
                            <li>• Zentra Finance (Native Money Market)</li>
                            <li>• Morpho (Isolated BTC Markets)</li>
                            <li>• ctUSD Stablecoin Borrowing</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '0.8rem', border: '1px solid var(--accent-primary)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', textAlign: 'center' }}>
                        <strong>Tip:</strong> Native Bitcoin vaults remove bridge risk. Monitor Aave V4 and Morpho for the latest TBV deployments.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </main>
          )}

        </div>
      )}
      {activeTab === 'Protocols' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="discovery-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Protocol Discovery</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Detailed insights into the engines powering decentralized finance</p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {[
              {
                name: 'Morpho',
                website: 'https://morpho.org',
                uniqueness: 'Layered Efficiency',
                highlights: 'Extends Aave/Compound with peer-to-peer matching. Offers isolated risk markets via Morpho Blue.',
                rateType: 'Floating / Adaptive',
                chains: ['Ethereum', 'Base', 'Arbitrum']
              },
              {
                name: 'Aave V3',
                website: 'https://aave.com',
                uniqueness: 'Global Liquidity Hub',
                highlights: 'Industry standard for lending. Features E-Mode for high-LTV stablecoin loops and Cross-chain Portals.',
                rateType: 'Floating',
                chains: ['Ethereum', 'Base', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism']
              },
              {
                name: 'Maker / Sky',
                website: 'https://sky.money',
                uniqueness: 'Stablecoin Engine',
                highlights: 'The origin of DAI/USDS. Uses Collateralized Debt Positions (CDPs) with fixed stability fees.',
                rateType: 'Fixed (Governance Set)',
                chains: ['Ethereum']
              },
              {
                name: 'Liquity V1',
                website: 'https://liquity.org',
                uniqueness: 'Zero-Interest Lending',
                highlights: 'Fully immutable, governance-free, ETH-only. Offers 0% interest loans with a one-time initiation fee.',
                rateType: 'Fixed (0%)',
                chains: ['Ethereum']
              },
              {
                name: 'Liquity V2',
                website: 'https://liquity.org',
                uniqueness: 'User-Set Rates',
                highlights: 'Multi-collateral evolution of Liquity. Introducing BOLD and market-driven individual interest rates.',
                rateType: 'Dynamic / User-Set',
                chains: ['Ethereum']
              },
              {
                name: 'Moonwell',
                website: 'https://moonwell.fi',
                uniqueness: 'Base L3 Native',
                highlights: 'Leading lending protocol on Base and Moonbeam. High performance and deep integration with Coinbase ecosystem.',
                rateType: 'Floating',
                chains: ['Base', 'Moonbeam', 'Moonriver']
              },
              {
                name: 'Kamino',
                website: 'https://kamino.finance',
                uniqueness: 'Solana Unified Layer',
                highlights: 'Combines lending, automated liquidity management, and leverage into a single Solana interface.',
                rateType: 'Floating',
                chains: ['Solana']
              },
              {
                name: 'Zentra',
                website: 'https://zentra.finance',
                uniqueness: 'Bitcoin ZK-Native',
                highlights: 'Native money market for Citrea (Bitcoin L2). Enables trust-minimized BTC borrowing and lending.',
                rateType: 'Floating',
                chains: ['Citrea']
              }
            ].map(p => (
              <div key={p.name} className="card protocol-card" style={{ 
                padding: '1.5rem', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{p.name}</h3>
                    <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      {p.website.replace('https://', '')} ↗
                    </a>
                  </div>
                  <div className="badge" style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                    {p.uniqueness}
                  </div>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {p.highlights}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Rate Type:</span>
                    <span style={{ fontWeight: 600 }}>{p.rateType}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {p.chains.map(c => (
                      <span key={c} style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px', 
                        background: 'rgba(255,255,255,0.05)', 
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
