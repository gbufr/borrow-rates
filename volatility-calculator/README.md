# Volatility Prediction Model

This project implements a deep learning model to predict the next-day volatility of assets (e.g., BTC, ETH) based on a rolling 30-day window of market data at 30-minute intervals.

## Project Structure

- `data/`: Contains historical price CSV files (e.g., `BTCUSDT_30m.csv`).
- `data_utils.py`: Utilities for data loading, preprocessing, and window generation.
- `model.py`: Defines the `VolatilityModel` architecture (1D-CNN based).
- `train.py`: Main script for training the model (parameterized).
- `predict.py`: CLI for running predictions (parameterized).
- `export_onnx.py`: Script to export PyTorch models to ONNX for TypeScript integration.
- `export_scaler.py`: Script to export scaling parameters to JSON.
- `requirements.txt`: Python dependencies.

## Model Logic

- **Input**: A rolling window of **30 days** (1440 observations) of 30m candles.
- **Features**: Log returns, rolling volatility (30 and 100 periods), and cumulative returns (1h, 4h, 24h).
- **Target**: The model predicts the **expected standard deviation of 30-minute log returns over the next 24 hours**.
- **Scaling**:
  - **Daily Volatility**: The raw model output is multiplied by $\sqrt{48}$ (since there are 48 30-minute intervals in 24 hours).
  - **Annualized Volatility**: The Daily Volatility is further multiplied by $\sqrt{365}$.

---

## 1. Training

The training script supports parameters to train models for different assets separately.

### Usage
```bash
# Train BTC model (default)
python3 train.py --symbol BTC

# Train ETH model with custom params
python3 train.py --symbol ETH --epochs 20 --batch_size 128
```

### Arguments
- `--symbol`: Asset symbol (e.g., BTC, ETH). Used for data loading and output naming.
- `--data_path`: Optional. Override the default data path `data/{symbol}USDT_30m.csv`.
- `--epochs`, `--batch_size`, `--lr`: Training hyperparameters.

### Outputs
- `{symbol}_volatility_model.pth`: Final model weights.
- `{symbol}_best_volatility_model.pth`: Weights for the epoch with the lowest validation loss.
- `{symbol}_scaler.joblib`: Persisted scaler for preprocessing.
- `checkpoints_{symbol}/`: Directory for intermediate model checkpoints.

---

## 2. CLI Prediction

You can run predictions directly from the command line once a model is trained.

### Usage
```bash
# Predict BTC using local data
python3 predict.py --symbol BTC

# Predict ETH fetching live data from Binance
python3 predict.py --symbol ETH --fetch
```

### Arguments
- `--symbol`: Asset symbol (supports BTC or BTCUSDT format).
- `--fetch`: Fetch the latest 33 days of data from Binance API instead of using local CSV files.

---

## 3. TypeScript & API Integration

To use the model in the backend, you must export it to ONNX and JSON formats.

### Exporting Models
```bash
# Export trained PyTorch weights to ONNX
python3 export_onnx.py --symbol BTC

# Export Scaler parameters to JSON
python3 export_scaler.py --symbol BTC
```

### API Endpoint
The backend provides a REST endpoint for real-time predictions:

**`GET /api/volatility/predict?symbol=BTC`**

**Response Example:**
```json
{
  "symbol": "BTC",
  "prediction_30m": 0.00523,
  "prediction_daily": 0.0362,
  "prediction_ann": 0.6933,
  "timestamp": 1776367773261
}
```

---

## Setup & Testing Note

### Manual Verification
To verify the entire pipeline:
1. Train a model: `python3 train.py --symbol BTC --epochs 1`
2. Export it: `python3 export_onnx.py --symbol BTC && python3 export_scaler.py --symbol BTC`
3. Test locally: `python3 predict.py --symbol BTC`
4. Test API: Start the main app and call the endpoint above.
