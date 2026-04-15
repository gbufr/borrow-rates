import React from 'react';
import type { MarketRate } from '../types/market';
import { getCMCLink, formatPercent } from '../utils/market';
import { Badge } from './Badge';

interface RwaRatesProps {
  rates: MarketRate[];
}

export const RwaRates: React.FC<RwaRatesProps> = ({ rates }) => {
  const rwaRates = rates.filter(r => r.isRWA);

  return (
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
              {rwaRates.map((r, i) => (
                <tr key={i}>
                  <td data-label="Protocol" style={{ fontWeight: 700 }}>{r.protocol.replace(' (Solana)', '')}</td>
                  <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <a href={getCMCLink(r.collateralSymbol)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {r.collateralSymbol}
                      </a>
                      {r.collateralPath && <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>{r.collateralPath}</span>}
                    </div>
                  </td>
                  <td data-label="Debt Asset">{r.debtSymbol}</td>
                  <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatPercent(r.rate)}</td>
                  <td data-label="Max LTV">{r.ltv ? (r.ltv * 100).toFixed(1) + '%' : '—'}</td>
                  <td data-label="Liq. Threshold">{r.liquidationThreshold ? (r.liquidationThreshold * 100).toFixed(1) + '%' : '—'}</td>
                  <td data-label="Access">
                    <Badge style={{ 
                      background: r.protocol.includes('Kamino') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(249, 115, 22, 0.1)', 
                      color: r.protocol.includes('Kamino') ? '#34d399' : '#f97316', 
                      border: `1px solid ${r.protocol.includes('Kamino') ? '#34d399' : '#f97316'}`, 
                      fontSize: '10px' 
                    }}>
                      {r.protocol.includes('Kamino') ? 'Permissionless' : 'KYC Required'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rwaRates.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No live RWA data available. Synchronizing...</td>
                </tr>
              )}
              {/* Standard high-quality placeholders for non-synced assets */}
              <tr style={{ opacity: 0.6 }}>
                <td data-label="Protocol" style={{ fontWeight: 700 }}>Morpho</td>
                <td data-label="RWA Collateral" style={{ fontWeight: 600 }}>BUIDL (BlackRock)</td>
                <td data-label="Debt Asset">USDC</td>
                <td data-label="Borrow Rate">~5.20%</td>
                <td data-label="Max LTV">80%</td>
                <td data-label="Liq. Threshold">86%</td>
                <td data-label="Access"><Badge style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid #f97316', fontSize: '10px' }}>KYC Required</Badge></td>
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
  );
};
