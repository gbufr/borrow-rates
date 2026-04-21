import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuOpen: () => void;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuOpen, onTabChange }) => {
  return (
    <header className="header">
      <button 
        className="mobile-menu-toggle"
        onClick={onMenuOpen}
      >
        <Menu size={24} />
      </button>
      <div 
        className="brand-group" 
        onClick={() => onTabChange('Volatility Prediction')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <img src="/logo.png" alt="Logo" className="brand-logo" />
        <div className="title-group">
          <h1>borrowdesk.org</h1>
          <p>DeFi borrow desk</p>
        </div>
      </div>
    </header>
  );
};
