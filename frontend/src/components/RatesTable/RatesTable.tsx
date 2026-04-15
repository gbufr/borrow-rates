import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import type { MarketRate } from '../../types/market';
import { FilterDropdown } from '../FilterDropdown';
import { RateRow } from './RateRow';
import { CHAINS, PROTOCOLS, COLLATERAL_ASSETS, DEBT_TOKENS } from '../../constants/market';

interface RatesTableProps {
  rates: MarketRate[];
  loading: boolean;
  tick: number;
  activeTab: string;
  filters: {
    protocol: string;
    debtToken: string;
    collateralAsset: string;
    chain: string;
    rateType: 'All' | 'fixed' | 'floating';
    search: string;
  };
  onFilterChange: (type: string, value: string) => void;
}

export const RatesTable: React.FC<RatesTableProps> = ({ 
  rates, 
  loading, 
  tick, 
  activeTab,
  filters,
  onFilterChange
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredRates = rates
    .filter(r => {
      const matchesSearch = !filters.search || r.assetPair.toLowerCase().includes(filters.search.toLowerCase()) || r.protocol.toLowerCase().includes(filters.search.toLowerCase());
      const matchesProtocol = filters.protocol === 'All' || r.protocol.includes(filters.protocol);
      const matchesChain = filters.chain === 'All' || r.chain === filters.chain;
      const matchesCollateral = filters.collateralAsset === 'All' || r.collateralSymbol === filters.collateralAsset;
      const matchesDebt = filters.debtToken === 'All' || r.debtSymbol === filters.debtToken;
      const matchesCategory = activeTab === 'Bitcoin' ? r.collateralCategory === 'BTC' : true;
      const matchesRateType = filters.rateType === 'All' || r.rateType === filters.rateType;
      return matchesSearch && matchesProtocol && matchesChain && matchesCollateral && matchesDebt && matchesCategory && matchesRateType;
    })
    .sort((a, b) => {
      const chainPriority: Record<string, number> = { 'Ethereum': 1, 'Base': 2, 'Arbitrum': 3 };
      const pA = chainPriority[a.chain] || 99;
      const pB = chainPriority[b.chain] || 99;
      if (pA !== pB) return pA - pB;
      const chainOrder = (a.chain || '').localeCompare(b.chain || '');
      if (chainOrder !== 0) return chainOrder;
      const protocolOrder = a.protocol.localeCompare(b.protocol);
      if (protocolOrder !== 0) return protocolOrder;
      return a.collateralSymbol.localeCompare(b.collateralSymbol);
    });

  if (loading) {
    return <div className="loading">Syncing with on-chain data...</div>;
  }

  return (
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
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'chain' ? null : 'chain')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Chain <ChevronDown size={12} style={{ opacity: filters.chain !== 'All' ? 1 : 0.5, color: filters.chain !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                </div>
                {activeFilter === 'chain' && (
                  <FilterDropdown title="Chain" options={CHAINS} current={filters.chain} onSelect={(v) => onFilterChange('chain', v)} onClose={() => setActiveFilter(null)} />
                )}
              </th>
              <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'protocol' ? null : 'protocol')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Protocol <ChevronDown size={12} style={{ opacity: filters.protocol !== 'All' ? 1 : 0.5, color: filters.protocol !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                </div>
                {activeFilter === 'protocol' && (
                  <FilterDropdown title="Protocol" options={PROTOCOLS} current={filters.protocol} onSelect={(v) => onFilterChange('protocol', v)} onClose={() => setActiveFilter(null)} />
                )}
              </th>
              <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'collateral' ? null : 'collateral')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Collateral <ChevronDown size={12} style={{ opacity: filters.collateralAsset !== 'All' ? 1 : 0.5, color: filters.collateralAsset !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                </div>
                {activeFilter === 'collateral' && (
                  <FilterDropdown title="Collateral" options={COLLATERAL_ASSETS} current={filters.collateralAsset} onSelect={(v) => onFilterChange('collateral', v)} onClose={() => setActiveFilter(null)} />
                )}
              </th>
              <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'debt' ? null : 'debt')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Debt <ChevronDown size={12} style={{ opacity: filters.debtToken !== 'All' ? 1 : 0.5, color: filters.debtToken !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                </div>
                {activeFilter === 'debt' && (
                  <FilterDropdown title="Debt Token" options={DEBT_TOKENS} current={filters.debtToken} onSelect={(v) => onFilterChange('debt', v)} onClose={() => setActiveFilter(null)} />
                )}
              </th>
              <th>Borrow rate</th>
              <th>LTV</th>
              <th>Liq. Threshold</th>
              <th style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveFilter(activeFilter === 'rateType' ? null : 'rateType')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Rate Type <ChevronDown size={12} style={{ opacity: filters.rateType !== 'All' ? 1 : 0.5, color: filters.rateType !== 'All' ? 'var(--accent-primary)' : 'inherit' }} />
                </div>
                {activeFilter === 'rateType' && (
                  <FilterDropdown title="Rate Type" options={['All', 'fixed', 'floating']} current={filters.rateType} onSelect={(v) => onFilterChange('rateType', v)} onClose={() => setActiveFilter(null)} />
                )}
              </th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredRates.map((r, i) => (
              <RateRow key={i} rate={r} tick={tick} />
            ))}
            {filteredRates.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No rates data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
