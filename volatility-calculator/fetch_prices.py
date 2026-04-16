import requests
import pandas as pd
import time
from datetime import datetime, timedelta, timezone
import os
from tqdm import tqdm

def fetch_klines(symbol, interval, start_time, end_time=None, limit=1000):
    url = "https://api.binance.com/api/v3/klines"
    params = {
        "symbol": symbol,
        "interval": interval,
        "startTime": start_time,
        "limit": limit
    }
    if end_time:
        params["endTime"] = end_time
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def download_history(symbol, interval, days=365):
    print(f"Downloading {interval} candles for {symbol} for the past {days} days...")
    
    # Calculate timestamps in ms
    now = datetime.now(timezone.utc)
    end_time_ms = int(now.timestamp() * 1000)
    start_time_ms = int((now - timedelta(days=days)).timestamp() * 1000)
    
    all_klines = []
    current_start = start_time_ms
    
    # Estimate total requests for progress bar
    # 365 days * 24 hours * 2 (30m candles) = 17520 candles
    # 17520 / 1000 = ~18 requests
    total_expected = (days * 24 * 60) // 30 # For 30m interval
    pbar = tqdm(total=total_expected)
    
    while current_start < end_time_ms:
        klines = fetch_klines(symbol, interval, current_start, end_time_ms)
        if not klines:
            break
            
        all_klines.extend(klines)
        
        # New start time is +1ms from the last kline's close time
        last_kline_end_ms = klines[-1][6]
        current_start = last_kline_end_ms + 1
        
        pbar.update(len(klines))
        
        # Rate limiting safety
        time.sleep(0.1)
        
        if len(klines) < 1000:
            break
            
    pbar.close()
    
    df = pd.DataFrame(all_klines, columns=[
        "timestamp", "open", "high", "low", "close", "volume", 
        "close_time", "quote_asset_volume", "number_of_trades", 
        "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume", "ignore"
    ])
    
    # Convert types
    numeric_cols = ["open", "high", "low", "close", "volume", "quote_asset_volume", 
                    "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col])
        
    # Convert timestamp to readable format
    df["datetime"] = pd.to_datetime(df["timestamp"], unit='ms')
    
    # Reorder columns to put datetime first for convenience
    cols = ["datetime"] + [c for c in df.columns if c != "datetime"]
    df = df[cols]
    
    os.makedirs("data", exist_ok=True)
    filename = f"data/{symbol}_{interval}.csv"
    df.to_csv(filename, index=False)
    print(f"Saved {len(df)} rows to {filename}")

if __name__ == "__main__":
    symbols = ["BTCUSDT", "ETHUSDT", "STETHUSDT"]
    interval = "30m"
    
    for symbol in symbols:
        try:
            download_history(symbol, interval)
        except Exception as e:
            print(f"Error downloading {symbol}: {e}")
