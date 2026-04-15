import React from 'react';
import type { MarketRate } from '../../types/market';
import { getCMCLink, getGroupedAsset, formatPercent } from '../../utils/market';
import { formatRelativeTime } from '../../utils/time';
import { Badge } from '../Badge';

interface RateRowProps {
  rate: MarketRate;
  tick: number;
}

export const RateRow: React.FC<RateRowProps> = ({ rate, tick }) => {
  return (
    <tr>
      <td data-label="Chain" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{rate.chain}</td>
      <td data-label="Protocol" style={{ fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {rate.protocol.replace('MCD', '').replace('Blue', '')}
          {!!rate.isRWA && <Badge style={{ background: 'var(--rwa-magenta)', color: '#fff', fontSize: '9px', padding: '1px 4px' }}>RWA</Badge>}
        </div>
      </td>
      <td data-label="Collateral">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a href={getCMCLink(rate.collateralSymbol)} target="_blank" rel="noopener noreferrer" className="asset-link" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            {getGroupedAsset(rate.collateralSymbol)}
          </a>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>Pegged to {rate.collateralCategory}</span>
        </div>
      </td>
      <td data-label="Debt">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a href={getCMCLink(rate.debtSymbol)} target="_blank" rel="noopener noreferrer" className="asset-link" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
            {rate.debtSymbol}
          </a>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>Pegged to {rate.debtCategory}</span>
        </div>
      </td>
      <td data-label="Borrow Rate" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{formatPercent(rate.rate)}</td>
      <td data-label="LTV" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{rate.ltv ? (rate.ltv * 100).toFixed(1) + '%' : '—'}</td>
      <td data-label="Liq. Threshold" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{rate.liquidationThreshold ? (rate.liquidationThreshold * 100).toFixed(1) + '%' : '—'}</td>
      <td data-label="Rate Type">
        <span style={{ fontSize: '11px', fontWeight: 600, color: rate.rateType === 'fixed' ? '#34d399' : '#60a5fa', textTransform: 'capitalize' }}>
          {rate.rateType || 'Floating'}
        </span>
      </td>
      <td data-label="Updated">
        <div data-tick={tick} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--risk-low)', boxShadow: '0 0 5px var(--risk-low)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {formatRelativeTime(rate.lastUpdateTimestamp)}
          </span>
        </div>
      </td>
    </tr>
  );
};
