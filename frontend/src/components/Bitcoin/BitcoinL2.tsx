import React from 'react';

export const BitcoinL2: React.FC = () => {
  const ecosystems = [
    {
      name: 'Babylon TBV',
      description: 'A modular security protocol that scales Bitcoin’s PoW security to PoS chains using native BTC staking.',
      highlights: [
        { label: 'Security', value: '1-of-N Honest Party (BitVM)' },
        { label: 'Custody', value: 'Non-custodial (Native Scripts)' }
      ],
      extra: 'Native BTC Staking (No Bridge)',
      url: 'https://babylonlabs.io',
      urlLabel: 'babylonlabs.io'
    },
    {
      name: 'Citrea ZK-Rollup',
      description: 'The first ZK-rollup that settles directly on Bitcoin, enabling EVM smart contracts with BTC security.',
      highlights: [
        { label: 'Security', value: '1-of-N Honest Party (BitVM)' },
        { label: 'Custody', value: 'BitVM Bridge (Fraud Proofs)' }
      ],
      extra: 'EVM-Compatible Contracts',
      url: 'https://citrea.xyz',
      urlLabel: 'citrea.xyz'
    },
    {
      name: 'Starknet',
      description: 'Expanding STARK-proof scaling to Bitcoin, enabling massive throughput and app-chains.',
      highlights: [
        { label: 'Security', value: '1-of-N Honest Party (BitVM)' },
        { label: 'Custody', value: 'ZK-Verifiable BitVM Bridge' }
      ],
      extra: 'Cairo-based Bitcoin scaling',
      url: 'https://starkware.co/starknet-on-bitcoin',
      urlLabel: 'starkware.co'
    },
    {
      name: 'Alpen Labs',
      description: 'Building ZK-rollup infrastructure to bring programmable money to Bitcoin.',
      highlights: [
        { label: 'Security', value: '1-of-N Honest Party (BitVM)' },
        { label: 'Custody', value: 'ZK-Proof BitVM Settlement' }
      ],
      extra: 'Verified state transitions',
      url: 'https://alpenlabs.io',
      urlLabel: 'alpenlabs.io'
    },
    {
      name: 'Bison Labs',
      description: 'A trustless ZK-rollup scaling Bitcoin with high-speed execution and low latency.',
      highlights: [
        { label: 'Security', value: '1-of-N Honest Party (BitVM)' },
        { label: 'Custody', value: 'ZK-STARK Bridge via BitVM' }
      ],
      extra: 'Optimized for high-speed DEX',
      url: 'https://bisonlabs.io',
      urlLabel: 'bisonlabs.io'
    },
    {
      name: 'Botanix',
      description: 'A fully decentralized EVM-compatible L2 built on top of the Bitcoin network.',
      highlights: [
        { label: 'Security', value: 'M-of-N (2/3 of dynamic set)' },
        { label: 'Custody', value: 'Decentralized Spiderchain' }
      ],
      extra: 'Full EVM compatibility',
      url: 'https://botanixlabs.xyz',
      urlLabel: 'botanixlabs.xyz'
    },
    {
      name: 'Stacks',
      description: 'A leading smart contract layer for Bitcoin, enabling DeFi and NFTs with Bitcoin settlement.',
      highlights: [
        { label: 'Security', value: 'M-of-N (70% Threshold)' },
        { label: 'Custody', value: 'Decentralized Signers (Stackers)' }
      ],
      extra: 'sBTC trust-minimized bridge',
      url: 'https://stacks.co',
      urlLabel: 'stacks.co'
    },
    {
      name: 'Blockstream Liquid',
      description: 'A sidechain for Bitcoin providing fast settlement, confidential transactions, and asset tokenization.',
      highlights: [
        { label: 'Security', value: 'M-of-N (11-of-15 Multisig)' },
        { label: 'Custody', value: 'Federated (Liquid Federation)' }
      ],
      extra: 'Confidential Transactions',
      url: 'https://blockstream.com/liquid',
      urlLabel: 'blockstream.com'
    }
  ];

  return (
    <div className="card" style={{ padding: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color: '#f7931a' }}>₿</span> Bitcoin Native Ecosystem
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {ecosystems.map(eco => (
          <div key={eco.name} className="discovery-box" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>{eco.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.4 }}>
              {eco.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {eco.highlights.map(h => (
                <p key={h.label} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <span style={{ color: '#fbbf24', marginRight: '0.5rem' }}>•</span><strong>{h.label}:</strong> {h.value}
                </p>
              ))}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                <span style={{ color: '#fbbf24', marginRight: '0.5rem' }}>•</span>{eco.extra}
              </p>
              <a href={eco.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', fontSize: '0.85rem', marginTop: '0.5rem', textDecoration: 'none' }}>{eco.urlLabel} ↗</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
