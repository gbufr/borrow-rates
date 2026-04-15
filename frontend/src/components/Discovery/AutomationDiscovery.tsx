import React from 'react';
import { AUTOMATION_DISCOVERY } from '../../constants/discovery';

export const AutomationDiscovery: React.FC = () => {
  return (
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
            {AUTOMATION_DISCOVERY.map(p => (
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
    </main>
  );
};
