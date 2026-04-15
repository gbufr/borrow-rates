import { useState, useEffect } from 'react';
import type { MarketRate } from '../types/market';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface MarketFilters {
  protocol: string;
  debtToken: string;
  collateralAsset: string;
  chain: string;
}

export function useMarketData(filters: MarketFilters) {
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Re-render timer for "ago" timestamps
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.protocol, filters.debtToken, filters.chain, filters.collateralAsset]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.protocol !== 'All') q.append('protocol', filters.protocol);
      if (filters.debtToken !== 'All') q.append('debtToken', filters.debtToken);
      if (filters.collateralAsset !== 'All') q.append('collateralAsset', filters.collateralAsset);
      if (filters.chain !== 'All') q.append('chain', filters.chain);
      
      const res = await fetch(`${API_BASE}/rates?${q.toString()}`);
      const data = await res.json();
      setRates(data);
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  return {
    rates,
    loading,
    tick,
    refresh: fetchData
  };
}
