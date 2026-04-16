# Volatility Prediction Model

This project implements a deep learning model to predict the next-day volatility of BTCUSDT based on a rolling 30-day window of market data.

## Project Structure

- `data/`: Contains the historical price CSV files.
- `data_utils.py`: Utilities for data loading, preprocessing, and window generation.
- `model.py`: Defines the `VolatilityModel` architecture (1D-CNN based).
- `train.py`: Main script for training the model.
- `requirements.txt`: Python dependencies.

## Model Logic

- **Input**: A rolling window of **30 days** of data at 30-minute intervals (1440 observations).
- **Features**: Log returns, rolling volatility (30 and 100 periods), and cumulative returns for various timeframes (1h, 4h, 24h).
- **Target**: Predicted volatility for the **next 24 hours**.

## How to Train

Follow these steps to set up the environment and start training:

### 1. Environment Setup

It is recommended to use a virtual environment:

```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

Install the required libraries using `pip`:

```bash
pip install -r requirements.txt
```

### 3. Run Training

Execute the training script:

```bash
python3 train.py
```

## How to Predict

Once you have trained the model (i.e., `volatility_model.pth` and `scaler.joblib` exist), you can run predictions:

```bash
# Predict using local data (last 30 days from CSV)
python3 predict.py

# Predict using live data fetched from Binance API
python3 predict.py --fetch --symbol BTCUSDT
```

### Prediction Arguments
- `--symbol`: The Binance symbol to fetch data for (default: `BTCUSDT`).
- `--fetch`: Flag to fetch the latest 30 days of data from Binance API instead of reading the local CSV.

### Training Configuration

You can modify the training parameters directly in `train.py`:
- `BATCH_SIZE`: Number of samples per training step.
- `EPOCHS`: Number of full passes through the dataset.
- `LR`: Learning rate for the Optimizer.
- `FILE_PATH`: Path to the historical data CSV.

The script will automatically detect if a GPU is available and use it; otherwise, it will default to CPU. 

### Model Saving & Checkpoints
- `best_volatility_model.pth`: The model with the absolute lowest validation loss discovered during the run.
- `volatility_model.pth`: The state of the model after the final epoch.
- `checkpoints/`: A directory containing timestamped backups of every "best" model found during training (e.g., `best_model_loss_0.00000251.pth`). This allows you to revert to earlier versions if overfitting occurs.
