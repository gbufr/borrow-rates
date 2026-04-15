import React, { useState } from 'react';
import type { MarketRate } from '../../types/market';
import { formatPercent } from '../../utils/market';

interface BitcoinBridgesProps {
  rates: MarketRate[];
}

export const BitcoinBridges: React.FC<BitcoinBridgesProps> = ({ rates }) => {
  const [expandedBridge, setExpandedBridge] = useState<string | null>(null);

  const bridges = [
    { asset: 'WBTC', issuer: 'BitGo', url: 'https://bitgo.com', role: 'DeFi standard, liquidity hub', mech: 'Custodial', chains: 'Ethereum, L2s', status: 'PoR Verified', assumption: '1-of-1 (BitGo Governance)', control: 'BitGo Trust' },
    { asset: 'cbBTC', issuer: 'Coinbase', url: 'https://coinbase.com', role: 'CeFi-to-DeFi institutional bridge', mech: 'Custodial', chains: 'Base, Ethereum', status: 'Institutional', assumption: '1-of-1 (Institutional)', control: 'Coinbase Custody' },
    { asset: 'LBTC', issuer: 'Lombard', url: 'https://lombard.finance', role: 'Babylon-native yield staking LST', mech: 'LST (Babylon)', chains: 'Ethereum, Base', status: 'Audited', assumption: 'M-of-N (Consortium)', control: 'Lombard Signers' },
    { asset: 'tBTC', issuer: 'Threshold', url: 'https://threshold.network', role: 'Permissionless bridge', mech: 'Decentralized', chains: 'Ethereum, L2s', status: 'Open Source', assumption: 'M-of-N (Decentralized TSS)', control: 'Threshold Nodes' },
    { asset: 'SolvBTC', issuer: 'Solv Protocol', url: 'https://solv.finance', role: 'Yield-bearing omni-chain BTC', mech: 'Yield Staking', chains: 'Solana, L2s', status: 'Audited', assumption: 'M-of-N (Multi-party)', control: 'Solv Guardians' },
    { asset: 'FBTC', issuer: 'Mantle/Ignition', url: 'https://fbtc.com', role: 'Mantle gas and collateral', mech: 'Consortium', chains: 'Mantle, Ethereum', status: 'Verified', assumption: 'M-of-N (11-of-15 Federation)', control: 'Ignition Federation' }
  ];

  return (
    <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        BTC Bridges & Issuers
      </h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Issuer</th>
              <th>Trust Assumption</th>
              <th>Controlled By</th>
              <th>Highlights</th>
              <th>Mechanism</th>
              <th>Chains</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bridges.map((b, idx) => (
              <React.Fragment key={idx}>
                <tr onClick={() => setExpandedBridge(expandedBridge === b.asset ? null : b.asset)} style={{ cursor: 'pointer' }}>
                  <td data-label="Asset" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{b.asset}</td>
                  <td data-label="Issuer"><a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{b.issuer}</a></td>
                  <td data-label="Trust Assumption" style={{ fontSize: '0.85rem' }}>{b.assumption}</td>
                  <td data-label="Controlled By" style={{ fontSize: '0.85rem' }}>{b.control}</td>
                  <td data-label="Highlights" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#fbbf24', marginRight: '0.5rem' }}>•</span>{b.role}
                  </td>
                  <td data-label="Mechanism">{b.mech}</td>
                  <td data-label="Chains">{b.chains}</td>
                  <td data-label="Status">{b.status}</td>
                </tr>
                {expandedBridge === b.asset && (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Borrowing Markets for {b.asset}</h4>
                        <table style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead><tr><th>Protocol</th><th>Debt</th><th>Rate</th><th>LTV</th></tr></thead>
                          <tbody>
                            {rates.filter(r => r.collateralSymbol === b.asset).map((r, ridx) => (
                              <tr key={ridx}>
                                <td>{r.protocol}</td><td>{r.debtSymbol}</td><td>{formatPercent(r.rate)}</td><td>{r.ltv ? (r.ltv * 100).toFixed(1) + '%' : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
