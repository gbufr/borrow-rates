import { useState } from 'react';
import './index.css';
import { useActiveTab } from './hooks/useActiveTab';
import { useMarketData } from './hooks/useMarketData';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { MobileSidebar } from './components/MobileSidebar';
import { RatesTable } from './components/RatesTable/RatesTable';
import { CefiRates } from './components/CefiRates';
import { RwaRates } from './components/RwaRates';
import { BitcoinBridges } from './components/Bitcoin/BitcoinBridges';
import { BitcoinL2 } from './components/Bitcoin/BitcoinL2';
import { ProtocolDiscovery } from './components/Discovery/ProtocolDiscovery';
import { InsuranceDiscovery } from './components/Discovery/InsuranceDiscovery';
import { AutomationDiscovery } from './components/Discovery/AutomationDiscovery';

function App() {
  const { activeTab, setActiveTab, btcSubTab, setBtcSubTab } = useActiveTab();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Filters state
  const [protocol, setProtocol] = useState('All');
  const [debtToken, setDebtToken] = useState('All');
  const [collateralAsset, setCollateralAsset] = useState('All');
  const [chain, setChain] = useState('All');
  const [search, setSearch] = useState('');
  const [rateTypeFilter, setRateTypeFilter] = useState<'All' | 'fixed' | 'floating'>('All');

  const { rates, loading, tick } = useMarketData({
    protocol,
    debtToken,
    collateralAsset,
    chain
  });

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'protocol': setProtocol(value); break;
      case 'debt': setDebtToken(value); break;
      case 'collateral': setCollateralAsset(value); break;
      case 'chain': setChain(value); break;
      case 'search': setSearch(value); break;
      case 'rateType': setRateTypeFilter(value as any); break;
    }
  };

  const tabs = ['DeFi Rates', 'CeFi Rates', 'Bitcoin', 'RWAs', 'Protocols', 'Insurance', 'Automation'];

  return (
    <div className="dashboard">
      <Header onMenuOpen={() => setIsMenuOpen(true)} />

      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <MobileSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {activeTab === 'CeFi Rates' && <CefiRates />}
      
      {activeTab === 'RWAs' && <RwaRates rates={rates} />}
      
      {activeTab === 'Protocols' && <ProtocolDiscovery />}
      
      {activeTab === 'Insurance' && <InsuranceDiscovery />}
      
      {activeTab === 'Automation' && <AutomationDiscovery />}

      {(activeTab === 'DeFi Rates' || activeTab === 'Bitcoin') && (
        <div className="tab-content-wrapper">
          {activeTab === 'Bitcoin' && (
            <div className="sub-tab-nav" style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem', 
              padding: '0 1rem',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              {['Rates', 'Bridges', 'L2'].map(sub => (
                <button
                  key={sub}
                  className={`sub-nav-btn ${btcSubTab === sub ? 'active' : ''}`}
                  onClick={() => setBtcSubTab(sub as any)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: btcSubTab === sub ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: btcSubTab === sub ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                >
                  {sub === 'Rates' ? 'Borrow Rates' : sub === 'Bridges' ? 'Bridges & Issuers' : 'L2 Ecosystem'}
                </button>
              ))}
            </div>
          )}

          <main className="section-content">
            {(activeTab !== 'Bitcoin' || btcSubTab === 'Rates') && (
              <RatesTable 
                rates={rates}
                loading={loading}
                tick={tick}
                activeTab={activeTab}
                filters={{
                  protocol,
                  debtToken,
                  collateralAsset,
                  chain,
                  search,
                  rateType: rateTypeFilter
                }}
                onFilterChange={handleFilterChange}
              />
            )}

            {activeTab === 'Bitcoin' && btcSubTab === 'L2' && <BitcoinL2 />}

            {activeTab === 'Bitcoin' && btcSubTab === 'Bridges' && <BitcoinBridges rates={rates} />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
