import React, { useEffect, useState } from 'react';
import { useActiveTab } from '../hooks/useActiveTab';

interface PredictionData {
  symbol: string;
  price: number;
  prediction_30m: number;
  prediction_daily: number;
  prediction_ann: number;
  timestamp: number;
}

const PositionSimulator: React.FC = () => {
  const { trackEvent } = useActiveTab();
  const [data, setData] = useState<{ [key: string]: PredictionData | null }>({
    BTC: null,
    ETH: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Position Simulator State
  const [collateralAsset, setCollateralAsset] = useState<'BTC' | 'ETH'>('BTC');
  const [collateralAmount, setCollateralAmount] = useState<number>(1);
  const [debtAmount, setDebtAmount] = useState<number>(50000);
  const [threshold, setThreshold] = useState<number>(0.8);
  
  // Safety Simulator State
  const [adjustmentMode, setAdjustmentMode] = useState<'withdraw' | 'repay'>('withdraw');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const [btcRes, ethRes] = await Promise.all([
        fetch('/api/volatility/predict?symbol=BTC'),
        fetch('/api/volatility/predict?symbol=ETH'),
      ]);
      
      if (!btcRes.ok || !ethRes.ok) {
        throw new Error('Server returned an error');
      }

      const [btcData, ethData] = await Promise.all([btcRes.json(), ethRes.json()]);
      setData({
        BTC: btcData,
        ETH: ethData,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      setError('Failed to load predictions. Please ensure the local backend is running.');
    } finally {
      setLoading(false);
    }
  };


  const currentPrice = data[collateralAsset]?.price || 0;
  const currentVol30m = Math.abs(data[collateralAsset]?.prediction_30m || 0);
  const currentVol24h = Math.abs(data[collateralAsset]?.prediction_daily || 0);
  
  const collateralValue = collateralAmount * currentPrice;
  const ltv = collateralValue > 0 ? debtAmount / collateralValue : 0;
  const healthFactor = debtAmount > 0 ? (collateralValue * threshold) / debtAmount : Infinity;
  const liquidationPrice = collateralAmount > 0 ? debtAmount / (collateralAmount * threshold) : 0;
  const distanceToLiq = currentPrice > 0 ? (currentPrice - liquidationPrice) / currentPrice : 0;

  // Projected Ranges
  const proj30m = { low: currentPrice * (1 - currentVol30m), high: currentPrice * (1 + currentVol30m) };
  const proj24h = { low: currentPrice * (1 - currentVol24h), high: currentPrice * (1 + currentVol24h) };

  // Risk Assessment
  const zScore = currentVol24h > 0 ? distanceToLiq / currentVol24h : 10;
  let riskLevel = 'Low';
  let riskColor = '#4ade80';
  let riskMessage = 'Safe (Probability of liquidation < 1% in 24h)';

  if (zScore < 1.5) {
    riskLevel = 'High';
    riskColor = '#f87171';
    riskMessage = 'Critical Risk: High probability of liquidation within 24h';
  } else if (zScore < 3) {
    riskLevel = 'Medium';
    riskColor = '#fbbf24';
    riskMessage = 'Moderated Risk: Volatility could trigger liquidation within 24h';
  }

  // Safety Metrics (Target Z-Score = 3)
  const targetZ = 3;
  const safetyFactor = 1 - (targetZ * currentVol24h);
  
  
  // Initial/Recommended Safety Metrics
  let suggestedWithdrawal = 0;
  if (safetyFactor > 0 && currentPrice > 0) {
    const requiredCollateral = debtAmount / (currentPrice * threshold * safetyFactor);
    suggestedWithdrawal = Math.max(0, collateralAmount - requiredCollateral);
  }

  let suggestedRepayment = 0;
  if (zScore < targetZ) {
    const targetDebt = collateralAmount * currentPrice * threshold * Math.max(0, safetyFactor);
    suggestedRepayment = Math.max(0, debtAmount - targetDebt);
  }

  // Update adjustment state when baseline changes, unless user is manually overriding
  useEffect(() => {
    if (!isManual) {
      if (zScore < 3) {
        setAdjustmentMode('repay');
        setAdjustmentAmount(suggestedRepayment);
      } else {
        setAdjustmentMode('withdraw');
        setAdjustmentAmount(suggestedWithdrawal);
      }
    }
  }, [zScore, suggestedWithdrawal, suggestedRepayment, isManual]);

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

  // Calculate Interactive Target Metrics based on current slider position
  const simCollateral = collateralAmount - (adjustmentMode === 'withdraw' ? adjustmentAmount : 0);
  const simDebt = debtAmount - (adjustmentMode === 'repay' ? adjustmentAmount : 0);
  
  const simLTV = simCollateral > 0 && currentPrice > 0 ? simDebt / (simCollateral * currentPrice) : 0;
  const simHealthFactor = simDebt > 0 ? (simCollateral * currentPrice * threshold) / simDebt : Infinity;
  const simLiqPrice = simCollateral > 0 ? simDebt / (simCollateral * threshold) : 0;
  const simDistanceToLiq = currentPrice > 0 ? (currentPrice - simLiqPrice) / currentPrice : 0;
  const simZScore = currentVol24h > 0 ? simDistanceToLiq / currentVol24h : 10;

  return (
    <div className="volatility-container">
      <div className="card optimization-card" style={{ marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.05)', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Position Simulator
        </h2>
        
        <div className="simulator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="inputs-panel">
            <div className="input-group">
              <label>Collateral Asset</label>
              <div className="toggle-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button 
                  className={`toggle-btn ${collateralAsset === 'BTC' ? 'active' : ''}`}
                  onClick={() => setCollateralAsset('BTC')}
                >BTC</button>
                <button 
                  className={`toggle-btn ${collateralAsset === 'ETH' ? 'active' : ''}`}
                  onClick={() => setCollateralAsset('ETH')}
                >ETH</button>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Collateral Amount ({collateralAsset})</label>
              <input 
                type="number" 
                value={collateralAmount} 
                onChange={(e) => setCollateralAmount(Number(e.target.value))}
                className="simulator-input"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Debt Amount (USD)</label>
              <input 
                type="number" 
                value={debtAmount} 
                onChange={(e) => setDebtAmount(Number(e.target.value))}
                className="simulator-input"
              />
            </div>

            <div className="input-group">
              <label>Liquidation Threshold (%)</label>
              <input 
                type="range" 
                min="0.5" 
                max="0.95" 
                step="0.01" 
                value={threshold} 
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(threshold * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="metrics-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="metric-row">
              <span>Current Price</span>
              <span className="value">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="metric-row">
              <span>Health Factor</span>
              <span className="value" style={{ color: healthFactor > 1.2 ? '#4ade80' : '#f87171' }}>
                {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
              </span>
            </div>
            <div className="metric-row">
              <span>Current LTV</span>
              <span className="value">{(ltv * 100).toFixed(2)}%</span>
            </div>
            <div className="metric-row">
              <span>Liquidation Price</span>
              <span className="value" style={{ color: '#fbbf24' }}>
                ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="metric-row">
              <span>Distance to Liq.</span>
              <span className="value">{(distanceToLiq * 100).toFixed(2)}%</span>
            </div>

            <div className="safety-metrics" style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>Safety Adjustments</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(74, 222, 128, 0.7)', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                Targets based on 24h volatility horizon. Always perform your own research (DYOR) before executing.
              </div>
              
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                <button 
                  onClick={() => { 
                    setAdjustmentMode('withdraw'); 
                    setAdjustmentAmount(suggestedWithdrawal);
                    setIsManual(true); 
                  }}
                  style={{ 
                    flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: 'none',
                    background: adjustmentMode === 'withdraw' ? '#4ade80' : 'rgba(255,255,255,0.05)',
                    color: adjustmentMode === 'withdraw' ? 'black' : 'white', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >Withdraw</button>
                <button 
                  onClick={() => { 
                    setAdjustmentMode('repay'); 
                    setAdjustmentAmount(suggestedRepayment);
                    setIsManual(true); 
                  }}
                  style={{ 
                    flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: 'none',
                    background: adjustmentMode === 'repay' ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                    color: adjustmentMode === 'repay' ? 'black' : 'white', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >Repay</button>
              </div>

              <div className="adjustment-slider" style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Amount</span>
                  <span style={{ fontSize: '0.8rem', color: adjustmentMode === 'withdraw' ? '#4ade80' : '#fbbf24', fontWeight: 'bold' }}>
                    {adjustmentAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {adjustmentMode === 'withdraw' ? collateralAsset : 'USD'}
                  </span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max={adjustmentMode === 'withdraw' ? collateralAmount : debtAmount}
                  step={adjustmentMode === 'withdraw' ? 0.0001 : 1}
                  value={adjustmentAmount}
                  onChange={(e) => { setAdjustmentAmount(Number(e.target.value)); setIsManual(true); }}
                  style={{ width: '100%', accentColor: adjustmentMode === 'withdraw' ? '#4ade80' : '#fbbf24' }}
                />
                {isManual && (
                  <button 
                    onClick={() => setIsManual(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.2rem', padding: 0 }}
                  >
                    Reset to recommended
                  </button>
                )}
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulated Metrics</div>
                  <div style={{ 
                    fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', 
                    background: simZScore >= 3 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                    color: simZScore >= 3 ? '#4ade80' : '#f87171'
                  }}>
                    Z-Score: {simZScore.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.1rem' }}>LTV</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{(simLTV * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.1rem' }}>Liq Price</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                      ${simLiqPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.1rem' }}>Distance</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>{(simDistanceToLiq * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.1rem' }}>Health Factor</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                      {simHealthFactor === Infinity ? '∞' : simHealthFactor.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="projections-section" style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Projections</div>
              <div className="metric-row" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Next 30m</span>
                <span className="value" style={{ fontSize: '0.85rem' }}>
                  ${proj30m.low.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${proj30m.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="metric-row" style={{ marginBottom: '0' }}>
                <span style={{ fontSize: '0.85rem' }}>Next 24h</span>
                <span className="value" style={{ fontSize: '0.85rem' }}>
                  ${proj24h.low.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${proj24h.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="risk-assessment" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="risk-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Risk Analysis</span>
                <span className="risk-badge" style={{ background: riskColor, color: 'black', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {riskLevel} RISK
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{riskMessage}</p>
              <div className="z-score-viz" style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    width: `${Math.min(100, Math.max(0, (zScore / 5) * 100))}%`, 
                    height: '100%', 
                    background: riskColor, 
                    borderRadius: '3px',
                    boxShadow: `0 0 10px ${riskColor}`
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>Liquidation imminent</span>
                <span>Highly Secure</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Want to check your real position? <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Connect your wallet to sync live data.</span>
              </p>
              <button 
                className="connect-wallet-btn"
                onClick={() => {
                  trackEvent('connect_wallet_click', 'Position Simulator', collateralAsset);
                  alert('Wallet connection coming soon!');
                }}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .toggle-btn {
          flex: 1;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        .simulator-input {
          width: 100%;
          padding: 0.8rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.8rem;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .metric-row .value {
          color: var(--text-primary);
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default PositionSimulator;
