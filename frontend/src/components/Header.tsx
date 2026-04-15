import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuOpen }) => {
  return (
    <header className="header">
      <button 
        className="mobile-menu-toggle"
        onClick={onMenuOpen}
      >
        <Menu size={24} />
      </button>
      <img src="/logo.png" alt="Logo" className="brand-logo" />
      <div className="title-group">
        <h1>borrowdesk.org</h1>
        <p>Live Borrow Rates across various markets</p>
      </div>
    </header>
  );
};
