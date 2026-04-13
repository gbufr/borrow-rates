import { useState, useEffect } from 'react';
import { 
  Search,
  Filter
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
}

function App() {
  const [protocol, setProtocol] = useState<string>('All');
  const [debtToken, setDebtToken] = useState<string>('All');
  const [collateralAsset, setCollateralAsset] = useState<string>('All');
  const [chain, setChain] = useState('All');
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('DeFi Rates');

  const chains = ['All', 'Ethereum', 'Base', 'Arbitrum', 'Solana'];
  const protocols = ['All', 'Morpho Blue', 'Aave V3', 'Maker MCD', 'Sky', 'Liquity V1', 'Liquity V2', 'Moonwell', 'Kamino', 'Solend'];
  const debtTokens = ['All', 'DAI', 'USDC', 'USDT', 'GHO', 'LUSD', 'USDS', 'BOLD', 'ctUSD'];
  const collateralAssets = ['All', 'WETH', 'WBTC', 'cbBTC', 'wstETH', 'weETH', 'LBTC', 'cBTC'];

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
        {['DeFi Rates', 'BTC Native', 'Centralized', 'RWAs'].map(t => (
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
        
        {activeTab === 'DeFi Rates' && (
          <div className="search-container" style={{ marginLeft: 'auto', alignSelf: 'center', marginBottom: '0.5rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search asset..." 
              className="search-input"
              style={{ padding: '0.4rem 0.8rem 0.4rem 2.2rem', fontSize: '0.85rem', width: '200px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </nav>

      <div className="tab-banner">
        {activeTab === 'DeFi Rates' && (
          <>
            <strong>Global Markets</strong>
            <span>Live DeFi borrow rates synchronized across Ethereum, Base, Solana, and Arbitrum ecosystems.</span>
          </>
        )}
        {activeTab === 'BTC Native' && (
          <>
            <strong>Bitcoin Scaling</strong>
            <span>Native Bitcoin vaults (Babylon, Citrea) remove bridge risk and enable trust-minimized borrowing.</span>
          </>
        )}
        {activeTab === 'Centralized' && (
          <>
            <strong>CeFi Metrics</strong>
            <span>Max LTV: Initial borrowing limit. | Liquidation: The threshold where your collateral is sold.</span>
          </>
        )}
        {activeTab === 'RWAs' && (
          <>
            <strong>Real-World Assets</strong>
            <span>Tokenized treasuries (BUIDL, USDY) provide low-volatility, yield-bearing institutional collateral.</span>
          </>
        )}
      </div>

      {activeTab === 'BTC Native' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Bitcoin Native Ecosystem</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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

          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#f7931a', fontSize: '1.4rem' }}>₿</span> Bridged & Native BTC Borrow Rates
              </h2>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Protocol</th>
                    <th>BTC Asset</th>
                    <th>Debt</th>
                    <th>Borrow rate</th>
                    <th>LTV</th>
                    <th>Liq. Threshold</th>
                    <th>Liq. Penalty</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {rates
                    .filter(r => r.collateralCategory === 'BTC')
                    .map((r, i) => {
                      const isNative = r.collateralSymbol === 'LBTC' || r.collateralSymbol === 'cBTC';
                      return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{r.protocol.replace('MCD', '').replace('Blue', '')}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{r.collateralSymbol}</td>
                        <td>{r.debtSymbol}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatPercent(r.rate)}</td>
                        <td>{r.ltv ? (r.ltv * 100).toFixed(1) + '%' : '—'}</td>
                        <td>{r.liquidationThreshold ? (r.liquidationThreshold * 100).toFixed(1) + '%' : '—'}</td>
                        <td style={{ color: '#ef4444' }}>{r.liquidationPenalty ? (r.liquidationPenalty * 100).toFixed(1) + '%' : '—'}</td>
                        <td>
                          <span className="badge" style={{ 
                            background: isNative ? 'rgba(245, 158, 11, 0.2)' : 'rgba(156, 163, 175, 0.1)',
                            color: isNative ? 'var(--btc-gold)' : 'var(--text-secondary)',
                            border: `1px solid ${isNative ? 'var(--btc-gold)' : 'var(--glass-border)'}`,
                            fontSize: '10px'
                          }}>
                            {isNative ? 'Native/TBV' : 'Bridged'}
                          </span>
                        </td>
                      </tr>
                    )})}
                  {rates.filter(r => r.collateralCategory === 'BTC').length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No BTC markets detected.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'Centralized' && (
        <main className="section-content" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--btc-gold)', fontSize: '1.4rem' }}>₿</span> Centralized BTC Borrowing (CeFi)
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

      {activeTab === 'DeFi Rates' && (
        <>
          <div className="filters-container" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div 
              className="filter-summary" 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '0.6rem',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chain</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{chain}</span>
                </div>
                <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{protocol.replace('MCD', '').replace('Blue', '')}</span>
                </div>
                <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collateral</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{collateralAsset}</span>
                </div>
                <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debt</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{debtToken}</span>
                </div>
              </div>
              <div 
                style={{ 
                  color: showFilters ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  padding: '0.5rem',
                  borderRadius: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  background: showFilters ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: showFilters ? 'var(--accent-primary)' : 'transparent'
                }}
              >
                <Filter size={18} />
              </div>
            </div>

            {showFilters && (
              <div className="filter-details" style={{ 
                padding: '1.5rem', 
                background: 'rgba(15, 23, 42, 0.4)', 
                borderRadius: '0.6rem', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                animation: 'slideDown 0.3s ease-out'
              }}>
                <div className="filter-group">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chains</div>
                  <div className="chain-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {chains.map(c => (
                      <button 
                        key={c}
                        className={`platform-btn ${chain === c ? 'active' : ''}`}
                        onClick={() => setChain(c)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--glass-border)',
                          background: chain === c ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.4)',
                          color: chain === c ? 'var(--bg-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol</div>
                  <div className="platform-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {protocols.map(p => (
                      <button 
                        key={p}
                        className={`platform-btn ${protocol === p ? 'active' : ''}`}
                        onClick={() => setProtocol(p)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--glass-border)',
                          background: protocol === p ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.4)',
                          color: protocol === p ? 'var(--bg-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {p.replace('MCD', '').replace('Blue', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collateral</div>
                  <div className="collateral-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {collateralAssets.map(t => (
                      <button 
                        key={t}
                        className={`platform-btn ${collateralAsset === t ? 'active' : ''}`}
                        onClick={() => setCollateralAsset(t)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--glass-border)',
                          background: collateralAsset === t ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.4)',
                          color: collateralAsset === t ? 'var(--bg-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debt Token</div>
                  <div className="debt-selector" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {debtTokens.map(t => (
                      <button 
                        key={t}
                        className={`platform-btn ${debtToken === t ? 'active' : ''}`}
                        onClick={() => setDebtToken(t)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--glass-border)',
                          background: debtToken === t ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.4)',
                          color: debtToken === t ? 'var(--bg-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">Syncing with on-chain data...</div>
          ) : (
            <main className="section-content">
              <div className="card">
                <div className="tab-banner" style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid var(--accent-primary)', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <strong>💡 Risk Intelligence Guide:</strong> <strong>Max LTV</strong> is the recommended safe borrow limit at loan opening. <strong>Liquidation Threshold</strong> is the hard limit where the protocol will seize your collateral. The space between these two is your <strong>Safety Buffer</strong> for price volatility.
                  </p>
                </div>
                <div className="section-header">
                  <h2>Live Borrow Rates in various markets</h2>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Protocol</th>
                        <th>Collateral</th>
                        <th>Debt</th>
                        <th>Borrow rate</th>
                        <th>LTV</th>
                        <th>Liq. Threshold</th>
                        <th>Liq. Penalty</th>
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
                          return matchesSearch && matchesProtocol && matchesChain && matchesCollateral && matchesDebt;
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
                          <td style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {r.protocol.replace('MCD', '').replace('Blue', '')}
                              {!!r.isRWA && <span className="badge" style={{ background: 'var(--rwa-magenta)', color: '#fff', fontSize: '9px', padding: '1px 4px' }}>RWA</span>}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: 400 }}>{r.chain}</div>
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
              </div>
            </main>
          )}
        </>
      )}
    </div>
  );
}

export default App;
