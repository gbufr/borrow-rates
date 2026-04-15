import React from 'react';
import { PROTOCOL_DISCOVERY } from '../../constants/discovery';

export const ProtocolDiscovery: React.FC = () => {
  return (
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
            {PROTOCOL_DISCOVERY.map(p => (
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
  );
};
