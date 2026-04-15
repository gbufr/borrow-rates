import { useState, useEffect } from 'react';
import { SLUG_TO_TAB, TAB_TO_SLUG } from '../constants/market';

const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

export function useActiveTab() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return SLUG_TO_TAB[hash] || 'DeFi Rates';
  });

  const [btcSubTab, setBtcSubTab] = useState<'Rates' | 'Bridges' | 'L2'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('bitcoin-bridges')) return 'Bridges';
    if (typeof window !== 'undefined' && window.location.hash.includes('bitcoin-l2')) return 'L2';
    return 'Rates';
  });

  const getBtcHash = (sub: string) => {
    if (sub === 'Bridges') return 'bitcoin-bridges';
    if (sub === 'L2') return 'bitcoin-l2';
    return 'bitcoin';
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const tab = SLUG_TO_TAB[hash];
      if (tab) {
        setActiveTab(tab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const slug = activeTab === 'Bitcoin' ? getBtcHash(btcSubTab) : TAB_TO_SLUG[activeTab];
    if (slug) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== slug) {
        window.history.replaceState(null, '', `#${slug}`);
      }
    }
  }, [activeTab, btcSubTab]);

  useEffect(() => {
    const titles: Record<string, string> = {
      'DeFi Rates': 'DeFi Borrow Rates & APYs | Aave, Morpho, Maker',
      'CeFi Rates': 'CeFi Lending Rates | Coinbase, Binance, Nexo',
      'Bitcoin': 'Bitcoin Borrow Rates | Citrea, Babylon, Lombard',
      'RWAs': 'RWA Lending Rates | BlackRock BUIDL, Ondo, Superstate',
      'Protocols': 'DeFi Protocol Discovery | High-Efficiency Engines',
      'Insurance': 'DeFi Insurance for Borrowers | Nexus Mutual, InsurAce',
      'Automation': 'DeFi Automation for Borrowers | DeFi Saver, Instadapp'
    };
    const title = titles[activeTab] || 'Live Borrow Rates';
    document.title = `${title} | borrowdesk.org`;
    trackEvent('view_tab', 'Navigation', activeTab);
  }, [activeTab]);

  // Engagement tracking
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_tab', 'Engagement', activeTab, duration);
    };
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    btcSubTab,
    setBtcSubTab,
    trackEvent
  };
}
