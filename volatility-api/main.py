import os
import torch
import joblib
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from model import VolatilityModel
from data_utils import prepare_inference_data, download_latest_data

app = Flask(__name__)

# CORS Configuration
cors_whitelist = os.environ.get("CORS_WHITELIST", "https://liquidax.app,http://localhost:3000,http://localhost:5173,https://borrowdesk.org,https://www.borrowdesk.org").split(",")
CORS(app, origins=cors_whitelist)

# Load Models and Scalers
device = torch.device("cpu") # Use CPU for GAE Standard
models = {}
scalers = {}

def load_resources():
    for asset in ["btc", "eth"]:
        model_path = f"{asset}_volatility_model.pth"
        scaler_path = f"{asset}_scaler.joblib"
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            print(f"Loading {asset.upper()} model and scaler...")
            input_dim = 6
            model = VolatilityModel(input_dim).to(device)
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()
            models[asset] = model
            scalers[asset] = joblib.load(scaler_path)
        else:
            print(f"Warning: {asset.upper()} model or scaler not found.")

load_resources()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "assets_loaded": list(models.keys())})

@app.route("/predict/<symbol>", methods=["GET"])
def predict(symbol):
    asset = symbol.lower().replace("usdt", "")
    if asset not in models:
        return jsonify({"error": f"Model for {symbol} not loaded or not supported."}), 404

    try:
        full_symbol = f"{asset.upper()}USDT"
        # Download latest ~35 days of data
        df = download_latest_data(full_symbol, "30m", days=35)
        
        # Prepare data
        X = prepare_inference_data(df, scalers[asset]).to(device)
        
        # Predict
        with torch.no_grad():
            prediction = models[asset](X)
            predicted_vol_30m = prediction.item()

        # Scaling
        # There are 48 30-minute intervals in 24 hours
        predicted_vol_day = predicted_vol_30m * (48 ** 0.5)
        # Annualized (365 days)
        predicted_vol_ann = predicted_vol_day * (365 ** 0.5)
        
        # Current Price
        current_price = df['close'].iloc[-1]
        
        return jsonify({
            "symbol": full_symbol,
            "current_price": float(current_price),
            "predicted_volatility_30m": predicted_vol_30m,
            "predicted_volatility_daily": predicted_vol_day,
            "predicted_volatility_annualized": predicted_vol_ann,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        app.logger.error(f"Error predicting for {symbol}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
