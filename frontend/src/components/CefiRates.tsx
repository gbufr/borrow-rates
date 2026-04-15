import React from 'react';

export const CefiRates: React.FC = () => {
  return (
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
                <td data-label="Platform" style={{ fontWeight: 700 }}>Kraken (Flexline)</td>
                <td data-label="Collateral">BTC (Native)</td>
                <td data-label="Debt">Fiat/USDT</td>
                <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>10% - 25%</td>
                <td data-label="Max LTV">50%</td>
                <td data-label="Liquidation">80%</td>
              </tr>
              <tr>
                <td data-label="Platform" style={{ fontWeight: 700 }}>Ledn</td>
                <td data-label="Collateral">BTC (Native)</td>
                <td data-label="Debt">USDC</td>
                <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.5% - 12%</td>
                <td data-label="Max LTV">50%</td>
                <td data-label="Liquidation">70%</td>
              </tr>
              <tr>
                <td data-label="Platform" style={{ fontWeight: 700 }}>Nebeus</td>
                <td data-label="Collateral">BTC/Stablecoins</td>
                <td data-label="Debt">EUR/GBP</td>
                <td data-label="Rate (APR)" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>~8.0%</td>
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
  );
};
