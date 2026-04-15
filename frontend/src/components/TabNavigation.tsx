import React from 'react';

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="tab-nav">
      {tabs.map(t => (
        <button
          key={t}
          className={`nav-btn ${activeTab === t ? 'active' : ''}`}
          onClick={() => onTabChange(t)}
        >
          {t}
        </button>
      ))}
    </nav>
  );
};
