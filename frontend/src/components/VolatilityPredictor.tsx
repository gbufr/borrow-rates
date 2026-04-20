import React, { useEffect, useState } from 'react';

interface PredictionData {
  symbol: string;
  current_price: number;
  predicted_volatility_30m: number;
  predicted_volatility_daily: number;
  predicted_volatility_annualized: number;
  timestamp: string;
}

const VolatilityPredictor: React.FC = () => {
  const [data, setData] = useState<{ [key: string]: PredictionData | null }>({
    BTC: null,
    ETH: null,
  });
  const [loading, setLoading] = useState(true);

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
      const [btcData, ethData] = await Promise.all([btcRes.json(), ethRes.json()]);
      setData({
        BTC: btcData,
        ETH: ethData,
      });
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading Volatility Predictions...</div>;
  }

  return (
    <div className="volatility-grid">
      {['BTC', 'ETH'].map((asset) => {
        const item = data[asset];
        if (!item) return null;

        const price = item.current_price;
        const vol30m = item.predicted_volatility_30m;
        const vol24h = item.predicted_volatility_daily;

        // Prediction ranges
        const range30m = {
          low: price * (1 - vol30m),
          high: price * (1 + vol30m),
        };
        const range24h = {
          low: price * (1 - vol24h),
          high: price * (1 + vol24h),
        };

        return (
          <div key={asset} className="card volatility-card">
            <div className="asset-header">
              <div className="asset-info">
                <h3>{asset} Volatility Predictor</h3>
                <span className="current-price">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="vol-badge">
                {(item.predicted_volatility_annualized * 100).toFixed(1)}% Ann. Vol
              </div>
            </div>

            <div className="prediction-section">
              <div className="prediction-label">
                <span>Next 30 Minutes</span>
                <span className="vol-value">±{(vol30m * 100).toFixed(3)}%</span>
              </div>
              <PriceRangeBar
                currentPrice={price}
                low={range30m.low}
                high={range30m.high}
                label="30m Range"
              />
              <div className="range-values">
                <span>${range30m.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span>${range30m.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="prediction-section">
              <div className="prediction-label">
                <span>Next 24 Hours</span>
                <span className="vol-value">±{(vol24h * 100).toFixed(2)}%</span>
              </div>
              <PriceRangeBar
                currentPrice={price}
                low={range24h.low}
                high={range24h.high}
                label="24h Range"
                color="var(--accent-secondary)"
              />
              <div className="range-values">
                <span>${range24h.low.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>${range24h.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        );
      })}
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
  const min = low - margin;
  const max = high + margin;
  const range = max - min;

  const getPos = (val: number) => ((val - min) / range) * 100;

  return (
    <div className="price-range-bar-container">
      <div className="bar-bg">
        <div 
          className="range-fill"
          style={{ 
            left: `${getPos(low)}%`, 
            width: `${getPos(high) - getPos(low)}%`,
            background: color,
            boxShadow: `0 0 20px ${color}` 
          }}
        />
        <div 
          className="current-marker"
          style={{ left: `${getPos(currentPrice)}%` }}
        >
          <div className="marker-line" />
          <div className="marker-label">Now</div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityPredictor;
