import { useState, useEffect } from 'react';
import { 
  Search,
  ChevronDown,
  X,
  Menu
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const chains = ['All', 'Ethereum', 'Base', 'Arbitrum', 'Solana', 'Citrea'];
  const protocols = ['All', 'Morpho Blue', 'Aave V3', 'Aave Horizon', 'Maker MCD', 'Sky', 'Liquity V1', 'Liquity V2', 'Moonwell', 'Kamino', 'Solend', 'Zentra (Citrea)'];
  const debtTokens = ['All', 'DAI', 'USDC', 'USDT', 'GHO', 'LUSD', 'USDS', 'BOLD', 'ctUSD'];
  const collateralAssets = ['All', 'WETH', 'WBTC', 'cbBTC', 'wstETH', 'weETH', 'LBTC', 'cBTC', 'WcBTC'];

  const tabToSlug: Record<string, string> = {
    'DeFi Rates': 'defi',
    'CeFi Rates': 'cefi',
    'Bitcoin': 'bitcoin',
    'RWAs': 'rwas',
    'Protocols': 'protocols',
    'Insurance': 'insurance',
    'Automation': 'automation'
  };

  const slugToTab: Record<string, string> = {
    'defi': 'DeFi Rates',
    'cefi': 'CeFi Rates',
    'bitcoin': 'Bitcoin',
    'rwas': 'RWAs',
    'rwa': 'RWAs',
    'protocols': 'Protocols',
    'insurance': 'Insurance',
    'automation': 'Automation'
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
    const titles: Record<string, string> = {
      'DeFi Rates': 'DeFi Borrow Rates & APYs | Aave, Morpho, Maker',
      'CeFi Rates': 'CeFi Lending Rates | Coinbase, Binance, Nexo',
      'Bitcoin': 'Bitcoin Borrow Rates | Citrea, Babylon, Lombard',
      'RWAs': 'RWA Lending Rates | BlackRock BUIDL, Ondo, Superstate',
      'Protocols': 'DeFi Protocol Discovery | High-Efficiency Engines',
      'Insurance': 'DeFi Insurance for Borrowers | Nexus Mutual, InsurAce',
      'Automation': 'DeFi Automation for Borrowers | DeFi Saver, Instadapp'
    };
    const title = titles[activeTab] || 'Live Borrow Rates';
    document.title = `${title} | borrowdesk.org`;
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
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <img src="/logo.png" alt="Logo" className="brand-logo" />
        <div className="title-group">
          <h1>borrowdesk.org</h1>
          <p>Live Borrow Rates across various markets</p>
        </div>
      </header>

      <nav className="tab-nav">
        {['DeFi Rates', 'CeFi Rates', 'Bitcoin', 'RWAs', 'Protocols', 'Insurance', 'Automation'].map(t => (
          <button
            key={t}
            className={`nav-btn ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className={`mobile-sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
        <aside className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="sidebar-header">
            <span className="sidebar-title">Menu</span>
            <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="sidebar-nav">
            {['DeFi Rates', 'CeFi Rates', 'Bitcoin', 'RWAs', 'Protocols', 'Insurance', 'Automation'].map(t => (
              <button
                key={t}
                className={`sidebar-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(t);
                  setIsMenuOpen(false);
                }}
              >
                {t}
              </button>
            ))}
          </nav>
        </aside>
      </div>




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
                    <td data-label="Platform" style={{ fontWeight: 700 }}>Coinbase</td>
                    <td data-label="Collateral">BTC (Native)</td>
                    <td data-label="Debt">USDC</td>
                    <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.75%</td>
                    <td data-label="Max LTV">75%</td>
                    <td data-label="Liquidation">86%</td>
                  </tr>
                  <tr>
                    <td data-label="Platform" style={{ fontWeight: 700 }}>Binance</td>
                    <td data-label="Collateral">BTC (Native)</td>
                    <td data-label="Debt">USDT</td>
                    <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Variable (5-12%)</td>
                    <td data-label="Max LTV">80%</td>
                    <td data-label="Liquidation">90%</td>
                  </tr>
                  <tr>
                    <td data-label="Platform" style={{ fontWeight: 700 }}>Crypto.com</td>
                    <td data-label="Collateral">BTC (Native)</td>
                    <td data-label="Debt">USDC</td>
                    <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.00%</td>
                    <td data-label="Max LTV">50%</td>
                    <td data-label="Liquidation">75%</td>
                  </tr>
                  <tr>
                    <td data-label="Platform" style={{ fontWeight: 700 }}>Nexo</td>
                    <td data-label="Collateral">BTC (Native)</td>
                    <td data-label="Debt">USDT/USDC</td>
                    <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~7.9% - 13.9%</td>
                    <td data-label="Max LTV">50%</td>
                    <td data-label="Liquidation">83.33%</td>
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
                    <td data-label="Protocol" style={{ fontWeight: 700 }}>Morpho</td>
                    <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>
                      <a href="https://www.blackrock.com/us/individual/products/335207/blackrock-usd-institutional-digital-liquidity-fund" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>BUIDL (BlackRock)</a>
                    </td>
                    <td data-label="Debt Asset">USDC</td>
                    <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.20%</td>
                    <td data-label="Max LTV">80%</td>
                    <td data-label="Liq. Threshold">86%</td>
                    <td data-label="Access"><span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', fontSize: '10px' }}>KYC Required</span></td>
                  </tr>
                  <tr>
                    <td data-label="Protocol" style={{ fontWeight: 700 }}>Aave Horizon</td>
                    <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>
                      <a href="https://coinmarketcap.com/currencies/ondo-ousg/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Ondo OUSG</a>
                    </td>
                    <td data-label="Debt Asset">GHO</td>
                    <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.50%</td>
                    <td data-label="Max LTV">85%</td>
                    <td data-label="Liq. Threshold">90%</td>
                    <td data-label="Access"><span className="badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid #ec4899', fontSize: '10px' }}>Institutional</span></td>
                  </tr>
                  <tr>
                    <td data-label="Protocol" style={{ fontWeight: 700 }}>Flux Finance</td>
                    <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>
                      <a href="https://coinmarketcap.com/currencies/ondo-usdy/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Ondo USDY</a>
                    </td>
                    <td data-label="Debt Asset">fUSDC</td>
                    <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.85%</td>
                    <td data-label="Max LTV">85%</td>
                    <td data-label="Liq. Threshold">92%</td>
                    <td data-label="Access"><span className="badge" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid #34d399', fontSize: '10px' }}>Permissionless</span></td>
                  </tr>
                  <tr>
                    <td data-label="Protocol" style={{ fontWeight: 700 }}>Morpho</td>
                    <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>
                      <a href="https://superstate.co/ustb" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Superstate USTB</a>
                    </td>
                    <td data-label="Debt Asset">USDC</td>
                    <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~5.15%</td>
                    <td data-label="Max LTV">90%</td>
                    <td data-label="Liq. Threshold">94.5%</td>
                    <td data-label="Access"><span className="badge" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', fontSize: '10px' }}>KYC Required</span></td>
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
                          // Sort by Chain Priority
                          const chainPriority: Record<string, number> = {
                            'Ethereum': 1,
                            'Base': 2,
                            'Arbitrum': 3
                          };
                          const pA = chainPriority[a.chain] || 99;
                          const pB = chainPriority[b.chain] || 99;
                          if (pA !== pB) return pA - pB;

                          const chainOrder = (a.chain || '').localeCompare(b.chain || '');
                          if (chainOrder !== 0) return chainOrder;
                          
                          // Sort by Protocol
                          const protocolOrder = a.protocol.localeCompare(b.protocol);
                          if (protocolOrder !== 0) return protocolOrder;
                          
                          // Sort by Collateral Symbol
                          return a.collateralSymbol.localeCompare(b.collateralSymbol);
                        })
                        .map((r, i) => (
                        <tr key={i}>
                          <td data-label="Chain" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{r.chain}</td>
                          <td data-label="Protocol" style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {r.protocol.replace('MCD', '').replace('Blue', '')}
                              {!!r.isRWA && <span className="badge" style={{ background: 'var(--rwa-magenta)', color: '#fff', fontSize: '9px', padding: '1px 4px' }}>RWA</span>}
                            </div>
                          </td>
                          <td data-label="Collateral">
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
                          <td data-label="Debt">
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
                          <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{formatPercent(r.rate)}</td>
                          <td data-label="LTV" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {r.ltv ? (r.ltv * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td data-label="Liq. Threshold" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {r.liquidationThreshold ? (r.liquidationThreshold * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td data-label="Rate Type">
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              color: r.rateType === 'fixed' ? '#34d399' : '#60a5fa',
                              textTransform: 'capitalize'
                            }}>
                              {r.rateType || 'Floating'}
                            </span>
                          </td>
                          <td data-label="Updated">
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {Math.floor((Date.now() / 1000 - r.lastUpdateTimestamp) / 60)}m ago
                            </span>
                          </td>
                        </tr>
                      ))}
                      {rates.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Borrowing Protocols</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Detailed insights into the engines powering decentralized finance</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Summary</th>
                  <th>Rate Mechanism</th>
                  <th>LTV Range</th>
                  <th>Access Type</th>
                  <th>Potential Risk Factors</th>
                  <th>Chains Supported</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {[
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
                ].map(p => (
                  <tr key={p.name}>
                    <td data-label="Protocol" style={{ fontWeight: 700 }}>{p.name}</td>
                    <td data-label="Summary" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.highlights}</td>
                    <td data-label="Uniqueness">
                      <span className="badge" style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent-primary)', fontSize: '0.75rem' }}>
                        {p.uniqueness}
                      </span>
                    </td>
                    <td data-label="Rate Mechanism" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.rateType}</td>
                    <td data-label="LTV Range" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.ltvRange}</td>
                    <td data-label="Access Type" style={{ fontSize: '0.85rem' }}>
                      <span style={{ 
                        color: p.access === 'Permissionless' ? '#4ade80' : '#fbbf24',
                        background: p.access === 'Permissionless' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {p.access}
                      </span>
                    </td>
                    <td data-label="Potential Risk Factors" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.risks}</td>
                    <td data-label="Chains Supported">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {p.chains.map(c => (
                          <span key={c} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Website">
                      <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {p.website.replace('https://', '')} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}
      {activeTab === 'Insurance' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="discovery-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>DeFi Insurance for Borrowers</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Protect your collateral and positions against on-chain risks</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Coverage Types</th>
                  <th>Key Features</th>
                  <th>Access Type</th>
                  <th>Risk Model</th>
                  <th>Chains Supported</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {[
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
                ].map(p => (
                  <tr key={p.name}>
                    <td data-label="Provider" style={{ fontWeight: 700 }}>{p.name}</td>
                    <td data-label="Coverage Types" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.types}</td>
                    <td data-label="Key Features" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.features}</td>
                    <td data-label="Access Type">
                        <span style={{ 
                        color: p.access === 'Permissionless' ? '#4ade80' : '#fbbf24',
                        background: p.access === 'Permissionless' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        {p.access}
                      </span>
                    </td>
                    <td data-label="Risk Model" style={{ fontSize: '0.85rem' }}>{p.riskModel}</td>
                    <td data-label="Chains Supported">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {p.chains.map(c => (
                          <span key={c} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Website">
                      <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {p.website.replace('https://', '')} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(34, 211, 238, 0.05)', borderRadius: '1rem', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>Why Borrowers Need Insurance</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              On-chain borrowing carries unique risks beyond market volatility. Smart contract exploits can result in loss of collateral, 
              while stablecoin de-pegging can trigger unwanted liquidations. Insurance protocols allow you to hedge these technical and 
              systemic risks for a small premium, ensuring your capital remains protected even if a protocol fails.
            </p>
          </div>
        </main>
      )}
      {activeTab === 'Automation' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="discovery-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Borrowing Automation & Wallets</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Advanced tools for rebalancing debt, protecting collateral, and managing leverage</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Core Automation Features</th>
                  <th>Managed Protocols</th>
                  <th>Access Type</th>
                  <th>Key Benefits</th>
                  <th>Chains Supported</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {[
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
                ].map(p => (
                  <tr key={p.name}>
                    <td data-label="Provider" style={{ fontWeight: 700 }}>{p.name}</td>
                    <td data-label="Automation" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{p.features}</td>
                    <td data-label="Managed Protocols">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {p.protocols.map(prot => (
                          <span key={prot} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '4px' }}>{prot}</span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Access Type">
                        <span style={{ 
                        color: p.access === 'Permissionless' ? '#4ade80' : '#fbbf24',
                        background: p.access === 'Permissionless' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        {p.access}
                      </span>
                    </td>
                    <td data-label="Key Benefits" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.benefits}</td>
                    <td data-label="Chains Supported">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {p.chains.map(c => (
                          <span key={c} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Website">
                      <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {p.website.replace('https://', '')} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(96, 165, 250, 0.05)', borderRadius: '1rem', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#60a5fa' }}>Professional Debt Management</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Automation tools allow borrowers to sleep easier by monitoring their Health Factor 24/7. 
              Features like "Boost" and "Repay" automatically adjust your position to maintain a target LTV, 
              preventing liquidation during flash crashes or optimizing capital efficiency when markets rise. 
              Smart wallets like Instadapp's Avocado further simplify cross-chain debt management by unifying liquidity.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
