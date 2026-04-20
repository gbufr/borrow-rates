import pandas as pd
import numpy as np
import torch
import requests
from datetime import datetime, timedelta, timezone

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

def download_latest_data(symbol, interval, days=32):
    """
    Download latest 'days' of data from Binance.
    We need ~31 days to have enough for rolling windows + 1440 window.
    """
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
