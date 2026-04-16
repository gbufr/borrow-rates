import torch
import pandas as pd
import joblib
import os
import argparse
from data_utils import prepare_inference_data, download_latest_data
from model import VolatilityModel

MODEL_PATH = "volatility_model.pth"
SCALER_PATH = "scaler.joblib"
DATA_PATH = "data/BTCUSDT_30m.csv"

def predict(symbol="BTCUSDT", fetch_live=False):
    # 1. Check if model and scaler exist
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        print("Error: Trained model or scaler not found. Please run train.py first.")
        return

    # 2. Load Model and Scaler
    print("Loading model and scaler...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    input_dim = 6 
    model = VolatilityModel(input_dim).to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    
    scaler = joblib.load(SCALER_PATH)

    # 3. Get Data
    if fetch_live:
        try:
            df = download_latest_data(symbol, "30m")
        except Exception as e:
            print(f"Error fetching data from Binance: {e}")
            return
    else:
        print(f"Reading data from {DATA_PATH}...")
        if not os.path.exists(DATA_PATH):
            print(f"Error: {DATA_PATH} not found. Try running with --fetch to get live data.")
            return
        df = pd.read_csv(DATA_PATH)
    
    # We need at least window_size (1440) + some buffer for lookback features (100)
    if len(df) < 1540:
        print(f"Error: Not enough data. Need at least 1540 rows (found {len(df)}).")
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
    print("Predicting...")
    with torch.no_grad():
        prediction = model(X)
        predicted_vol_30m = prediction.item()

    # Scaling
    # There are 48 30-minute intervals in 24 hours
    predicted_vol_day = predicted_vol_30m * (48 ** 0.5)
    # Annualized (365 days)
    predicted_vol_ann = predicted_vol_day * (365 ** 0.5)

    print("\n" + "="*40)
    print(f"Symbol: {symbol}")
    print(f"Predicted Volatility (30m):  {predicted_vol_30m:.8f}")
    print(f"Predicted Volatility (Daily): {predicted_vol_day:.4%}")
    print(f"Predicted Volatility (Ann):   {predicted_vol_ann:.2%}")
    print("="*40)
    
    # Optional: Contextualize
    historical_vol = df['close'].pct_change().std()
    print(f"Historical Sample Volatility (std of returns): {historical_vol:.6f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict next-day volatility.")
    parser.add_argument("--symbol", type=str, default="BTCUSDT", help="Binance symbol (default: BTCUSDT)")
    parser.add_argument("--fetch", action="store_true", help="Fetch latest data from Binance API")
    
    args = parser.parse_args()
    predict(symbol=args.symbol, fetch_live=args.fetch)
