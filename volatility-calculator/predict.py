import torch
import pandas as pd
import joblib
import os
import argparse
from data_utils import prepare_inference_data, download_latest_data
from model import VolatilityModel

def predict(asset_symbol="BTC", fetch_live=False):
    # Determine symbol for paths (btc, eth, etc.)
    # The input symbol might be BTCUSDT or just BTC
    base_symbol = asset_symbol.replace("USDT", "").lower()
    full_symbol = f"{base_symbol.upper()}USDT"
    
    model_path = f"{base_symbol}_volatility_model.pth"
    scaler_path = f"{base_symbol}_scaler.joblib"
    data_path = f"data/{full_symbol}_30m.csv"

    # 1. Check if model and scaler exist
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        print(f"Error: Trained model ({model_path}) or scaler ({scaler_path}) not found for {base_symbol.upper()}.")
        print(f"Please run: python train.py --symbol {base_symbol.upper()}")
        return

    # 2. Load Model and Scaler
    print(f"Loading model ({model_path}) and scaler ({scaler_path})...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    input_dim = 6 
    model = VolatilityModel(input_dim).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    
    scaler = joblib.load(scaler_path)

    # 3. Get Data
    if fetch_live:
        try:
            df = download_latest_data(full_symbol, "30m")
        except Exception as e:
            print(f"Error fetching data from Binance for {full_symbol}: {e}")
            return
    else:
        print(f"Reading data from {data_path}...")
        if not os.path.exists(data_path):
            print(f"Error: {data_path} not found. Try running with --fetch to get live data.")
            return
        df = pd.read_csv(data_path)
    
    # We need at least window_size (1440) + some buffer for lookback features (100)
    if len(df) < 1540:
        print(f"Error: Not enough data for {full_symbol}. Need at least 1540 rows (found {len(df)}).")
        if not fetch_live:
            print("Hint: Try running with --fetch to get the latest 30 days of data.")
        return

    # 4. Prepare Data for Inference
    try:
        X = prepare_inference_data(df, scaler).to(device)
    except Exception as e:
        print(f"Error during preprocessing: {e}")
        return

    # 5. Predict
    print(f"Predicting for {full_symbol}...")
    with torch.no_grad():
        prediction = model(X)
        predicted_vol_30m = prediction.item()

    # Scaling
    # There are 48 30-minute intervals in 24 hours
    predicted_vol_day = predicted_vol_30m * (48 ** 0.5)
    # Annualized (365 days)
    predicted_vol_ann = predicted_vol_day * (365 ** 0.5)

    print("\n" + "="*40)
    print(f"Symbol: {full_symbol}")
    print(f"Predicted Volatility (30m):  {predicted_vol_30m:.8f}")
    print(f"Predicted Volatility (Daily): {predicted_vol_day:.4%}")
    print(f"Predicted Volatility (Ann):   {predicted_vol_ann:.2%}")
    print("="*40)
    
    # Optional: Contextualize
    historical_vol = df['close'].pct_change().std()
    print(f"Historical Sample Volatility (std of returns): {historical_vol:.6f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict next-day volatility.")
    parser.add_argument("--symbol", type=str, default="BTC", help="Asset symbol or Binance symbol (e.g., BTC, BTCUSDT, ETH, ETHUSDT)")
    parser.add_argument("--fetch", action="store_true", help="Fetch latest data from Binance API")
    
    args = parser.parse_args()
    predict(asset_symbol=args.symbol, fetch_live=args.fetch)
