import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import torch
from torch.utils.data import Dataset, DataLoader
import requests
from datetime import datetime, timedelta, timezone

class VolatilityDataset(Dataset):
    def __init__(self, X, y_vol):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y_vol = torch.tensor(y_vol, dtype=torch.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y_vol[idx]

def load_and_preprocess(file_path, window_size=1440, target_steps=48):
    """
    Load data and calculate targets and features.
    window_size: 1440 (30 days of 30m candles)
    target_steps: 48 (24 hours of 30m candles)
    """
    print(f"Loading data from {file_path}...")
    df = pd.read_csv(file_path)
    df['datetime'] = pd.to_datetime(df['datetime'])
    df = df.sort_values('datetime')

    # Basic Returns
    df['returns'] = np.log(df['close'] / df['close'].shift(1))
    
    # --- Targets ---
    # Volatility: std of returns for the next 24 hours
    df['target_volatility'] = df['returns'].rolling(window=target_steps).std().shift(-target_steps)

    # --- Features ---
    # Log returns as primary feature
    # Additional features to help the model
    df['vol_rolling_30'] = df['returns'].rolling(30).std()
    df['vol_rolling_100'] = df['returns'].rolling(100).std()
    
    df['returns_1h'] = df['returns'].rolling(2).sum()
    df['returns_4h'] = df['returns'].rolling(8).sum()
    df['returns_24h'] = df['returns'].rolling(48).sum()

    # Drop NaNs created by rolling windows and shifts
    df = df.dropna().reset_index(drop=True)

    feature_cols = ['returns', 'vol_rolling_30', 'vol_rolling_100', 'returns_1h', 'returns_4h', 'returns_24h']
    
    # Scale features
    scaler = StandardScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])

    # Convert to sliding window format
    # X shape: (samples, window_size, num_features)
    data_feat = df[feature_cols].values
    target_vol = df['target_volatility'].values

    X, y_v = [], []
    
    # To optimize, we won't take every single window if the dataset is too large
    # but for BTCUSDT_30m (17k rows), it's fine.
    # Total windows = len(df) - window_size + 1
    # However, we need to ensure we don't overlap too much if we want distinct samples.
    # Let's just take all possible windows for max data.
    
    print("Generating windows...")
    for i in range(window_size, len(df)):
        X.append(data_feat[i-window_size:i])
        y_v.append(target_vol[i]) # Target is "next day starting from now (i)"

    return np.array(X), np.array(y_v), scaler

def get_dataloaders(file_path, batch_size=32, train_split=0.8):
    X, y_v, scaler = load_and_preprocess(file_path)
    
    split_idx = int(len(X) * train_split)
    
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_v_train, y_v_test = y_v[:split_idx], y_v[split_idx:]
    
    train_ds = VolatilityDataset(X_train, y_v_train)
    test_ds = VolatilityDataset(X_test, y_v_test)
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
    
    return train_loader, test_loader, scaler

def prepare_inference_data(df, scaler, window_size=1440):
    """
    Preprocess data for a single prediction based on the latest window.
    """
    df = df.copy()
    df['returns'] = np.log(df['close'] / df['close'].shift(1))
    
    df['vol_rolling_30'] = df['returns'].rolling(30).std()
    df['vol_rolling_100'] = df['returns'].rolling(100).std()
    
    df['returns_1h'] = df['returns'].rolling(2).sum()
    df['returns_4h'] = df['returns'].rolling(8).sum()
    df['returns_24h'] = df['returns'].rolling(48).sum()

    df = df.dropna().reset_index(drop=True)
    
    feature_cols = ['returns', 'vol_rolling_30', 'vol_rolling_100', 'returns_1h', 'returns_4h', 'returns_24h']
    
    # Scale features using the PROVIDED scaler
    df[feature_cols] = scaler.transform(df[feature_cols])
    
    # Take the last window_size samples
    if len(df) < window_size:
        raise ValueError(f"Not enough data for inference. Need at least {window_size} rows after preprocessing.")
    
    window = df[feature_cols].values[-window_size:]
    X = torch.tensor(window, dtype=torch.float32).unsqueeze(0) # (1, seq_len, features)
    
    return X

def fetch_klines(symbol, interval, start_time, limit=1000):
    url = "https://api.binance.com/api/v3/klines"
    params = {
        "symbol": symbol,
        "interval": interval,
        "startTime": start_time,
        "limit": limit
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def download_latest_data(symbol, interval, days=31):
    """
    Download latest 'days' of data from Binance.
    """
    print(f"Fetching latest {days} days of data for {symbol}...")
    now = datetime.now(timezone.utc)
    start_time_ms = int((now - timedelta(days=days)).timestamp() * 1000)
    
    all_klines = []
    current_start = start_time_ms
    
    while True:
        klines = fetch_klines(symbol, interval, current_start)
        if not klines:
            break
        all_klines.extend(klines)
        last_kline_end_ms = klines[-1][6]
        current_start = last_kline_end_ms + 1
        if len(klines) < 1000:
            break

    df = pd.DataFrame(all_klines, columns=[
        "timestamp", "open", "high", "low", "close", "volume", 
        "close_time", "quote_asset_volume", "number_of_trades", 
        "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume", "ignore"
    ])
    
    numeric_cols = ["open", "high", "low", "close", "volume", "quote_asset_volume"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col])
        
    return df
