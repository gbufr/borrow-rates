import React, { useEffect, useState } from 'react';

interface PredictionData {
  symbol: string;
  price: number;
  prediction_30m: number;
  prediction_daily: number;
  prediction_ann: number;
  timestamp: number;
}

const VolatilityOverview: React.FC = () => {
  const [data, setData] = useState<{ [key: string]: PredictionData | null }>({
    BTC: null,
    ETH: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const [btcRes, ethRes] = await Promise.all([
        fetch('https://volatility-api.lm.r.appspot.com/predict/BTC'),
        fetch('https://volatility-api.lm.r.appspot.com/predict/ETH'),
      ]);
      
      if (!btcRes.ok || !ethRes.ok) {
        throw new Error('Volatility API returned an error');
      }

      const [btcRaw, ethRaw] = await Promise.all([btcRes.json(), ethRes.json()]);
      
      // Map Python API fields to our expected format
      const mapData = (raw: any): PredictionData => ({
        symbol: raw.symbol,
        price: raw.current_price,
        prediction_30m: raw.predicted_volatility_30m,
        prediction_daily: raw.predicted_volatility_daily,
        prediction_ann: raw.predicted_volatility_annualized,
        timestamp: new Date(raw.timestamp).getTime()
      });

      setData({
        BTC: mapData(btcRaw),
        ETH: mapData(ethRaw),
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      setError('Failed to load predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading Market Data...</div>;
  }

  if (error) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center', color: '#ff4d4d' }}>
        <p>{error}</p>
        <button onClick={fetchPredictions} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="volatility-container">
      <div className="volatility-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {['BTC', 'ETH'].map((asset) => {
        const item = data[asset];
        if (!item) return null;

        const price = item.price;
        const vol30m = Math.abs(item.prediction_30m);
        const vol24h = Math.abs(item.prediction_daily);
        const volAnn = Math.abs(item.prediction_ann);

        const range30m = { low: price * (1 - vol30m), high: price * (1 + vol30m) };
        const range24h = { low: price * (1 - vol24h), high: price * (1 + vol24h) };

        return (
          <div key={asset} className="card volatility-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem' }}>
            <div className="asset-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div className="asset-info">
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{asset} Market Volatility</h3>
                <div className="current-price" style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="vol-badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                {(volAnn * 100).toFixed(1)}% IV
              </div>
            </div>

            <div className="prediction-section" style={{ marginBottom: '1.5rem' }}>
              <div className="prediction-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expected 30m Move</span>
                <span className="vol-value" style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>±{(vol30m * 100).toFixed(3)}%</span>
              </div>
              <PriceRangeBar currentPrice={price} low={range30m.low} high={range30m.high} label="30m Range" />
              <div className="range-values" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>${range30m.low.toLocaleString()}</span>
                <span>${range30m.high.toLocaleString()}</span>
              </div>
            </div>

            <div className="prediction-section">
              <div className="prediction-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expected 24h Move</span>
                <span className="vol-value" style={{ fontWeight: '600', color: '#fbbf24' }}>±{(vol24h * 100).toFixed(2)}%</span>
              </div>
              <PriceRangeBar currentPrice={price} low={range24h.low} high={range24h.high} label="24h Range" color="#fbbf24" />
              <div className="range-values" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>${range24h.low.toLocaleString()}</span>
                <span>${range24h.high.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

interface PriceRangeBarProps {
  currentPrice: number;
  low: number;
  high: number;
  label: string;
  color?: string;
}

const PriceRangeBar: React.FC<PriceRangeBarProps> = ({ currentPrice, low, high, color = 'var(--accent-primary)' }) => {
  const spread = high - low;
  const margin = spread * 0.4;
  const min = Math.max(0, low - margin);
  const max = high + margin;
  const range = max - min;

  const getPos = (val: number) => ((val - min) / range) * 100;

  return (
    <div className="price-range-bar-container" style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', position: 'relative', overflow: 'visible', margin: '15px 0' }}>
      <div className="bar-bg" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div 
          className="range-fill"
          style={{ 
            position: 'absolute',
            top: 0,
            left: `${getPos(low)}%`, 
            width: `${getPos(high) - getPos(low)}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            boxShadow: `0 0 20px ${color}44` 
          }}
        />
        <div 
          className="current-marker"
          style={{ 
            position: 'absolute',
            top: '50%',
            left: `${getPos(currentPrice)}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          <div className="marker-line" style={{ width: '2px', height: '16px', background: 'white', borderRadius: '1px' }} />
          <div className="marker-label" style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'white', textTransform: 'uppercase', fontWeight: 'bold', background: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: '4px' }}>Now</div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityOverview;
