import joblib
import json
import argparse
import os

def export_scaler(symbol):
    symbol_lower = symbol.lower()
    scaler_path = f"{symbol_lower}_scaler.joblib"
    json_path = f"{symbol_lower}_scaler.json"
    
    if not os.path.exists(scaler_path):
        # Try generic if not found
        scaler_path = "scaler.joblib"
        if not os.path.exists(scaler_path):
            print(f"Error: Scaler file for {symbol} not found.")
            return

    print(f"Loading scaler from {scaler_path}...")
    scaler = joblib.load(scaler_path)
    
    # StandardScaler has 'mean_' and 'scale_' attributes
    scaler_params = {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "feature_names": ['returns', 'vol_rolling_30', 'vol_rolling_100', 'returns_1h', 'returns_4h', 'returns_24h']
    }
    
    print(f"Exporting to {json_path}...")
    with open(json_path, 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"Scaler parameters saved to {json_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export StandardScaler to JSON.")
    parser.add_argument("--symbol", type=str, required=True, help="Asset symbol (e.g., BTC, ETH)")
    args = parser.parse_args()
    export_scaler(args.symbol)
