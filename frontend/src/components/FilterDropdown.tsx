import React from 'react';
import { X } from 'lucide-react';

interface FilterDropdownProps {
  title: string;
  options: string[];
  current: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  title, 
  options, 
  current, 
  onSelect, 
  onClose 
}) => (
  <div className="filter-dropdown" style={{
    position: 'absolute',
    top: '100%',
    left: 0,
    background: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '0.6rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    minWidth: '160px',
    padding: '0.5rem',
    marginTop: '0.5rem',
    backdropFilter: 'blur(20px)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem 0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{title}</span>
      <X size={12} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onClose(); }} />
    </div>
    <div className="filter-options-list" style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {options.map(opt => (
        <button
          key={opt}
          className={current === opt ? 'selected' : ''}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(opt);
            onClose();
          }}
          style={{
            padding: '0.5rem 0.75rem',
            textAlign: 'left',
            background: current === opt ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
            color: current === opt ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '0.4rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: current === opt ? 600 : 400,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          {opt.replace('MCD', '').replace('Blue', '')}
        </button>
      ))}
    </div>
  </div>
);
