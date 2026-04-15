import React from 'react';
import { X } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  isOpen, 
  onClose, 
  tabs, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className={`mobile-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <aside className={`mobile-sidebar ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <span className="sidebar-title">Menu</span>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(t => (
            <button
              key={t}
              className={`sidebar-btn ${activeTab === t ? 'active' : ''}`}
              onClick={() => {
                onTabChange(t);
                onClose();
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
};
