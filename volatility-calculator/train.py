import torch
import torch.nn as nn
import torch.optim as optim
from data_utils import get_dataloaders
from model import VolatilityModel
import os
import numpy as np
import joblib
import argparse

def train(symbol, data_path, epochs, batch_size, lr):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    print(f"Training model for {symbol} using data from {data_path}")

    # Determine paths based on symbol
    symbol_lower = symbol.lower()
    model_path = f"{symbol_lower}_volatility_model.pth"
    best_model_path = f"{symbol_lower}_best_volatility_model.pth"
    scaler_path = f"{symbol_lower}_scaler.joblib"
    checkpoint_dir = f"checkpoints_{symbol_lower}"

    # Load data
    train_loader, test_loader, scaler = get_dataloaders(data_path, batch_size=batch_size)
    
    # Ensure checkpoint directory exists
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    # Initialize model
    input_dim = 6 # [returns, vol_30, vol_100, ret_1h, ret_4h, ret_24h]
    model = VolatilityModel(input_dim).to(device)
    
    # Loss function
    vol_criterion = nn.MSELoss()
    
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    best_loss = float('inf')

    for epoch in range(epochs):
        model.train()
        train_losses = []
        
        for batch_idx, (X, y_vol) in enumerate(train_loader):
            X, y_vol = X.to(device), y_vol.to(device)
            
            optimizer.zero_grad()
            
            vol_pred = model(X)
            
            loss = vol_criterion(vol_pred, y_vol)
            
            loss.backward()
            optimizer.step()
            
            train_losses.append(loss.item())

        # Validation
        model.eval()
        val_losses = []
        
        with torch.no_grad():
            for X, y_vol in test_loader:
                X, y_vol = X.to(device), y_vol.to(device)
                vol_pred = model(X)
                
                loss = vol_criterion(vol_pred, y_vol)
                val_losses.append(loss.item())

        avg_train_loss = np.mean(train_losses)
        avg_val_loss = np.mean(val_losses)
        
        print(f"Epoch [{epoch+1}/{epochs}], Train Loss: {avg_train_loss:.8f}, Val Loss: {avg_val_loss:.8f}")
        
        if avg_val_loss < best_loss:
            best_loss = avg_val_loss
            # Save the latest best model
            torch.save(model.state_dict(), best_model_path)
            
            # Also keep a copy in the checkpoint directory
            checkpoint_path = os.path.join(checkpoint_dir, f"best_model_loss_{best_loss:.8f}.pth")
            torch.save(model.state_dict(), checkpoint_path)
            
            print(f"New best model saved to {best_model_path} and {checkpoint_path}")
    
    # Save the current model state (last epoch)
    torch.save(model.state_dict(), model_path)
    
    # Save the scaler for inference
    joblib.dump(scaler, scaler_path)
    print(f"Scaler saved to {scaler_path}")

    print(f"Training for {symbol} complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train volatility prediction model.")
    parser.add_argument("--symbol", type=str, default="BTC", help="Asset symbol (e.g., BTC, ETH)")
    parser.add_argument("--data_path", type=str, help="Path to CSV data file (default: data/{symbol}USDT_30m.csv)")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size (default: 64)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs (default: 10)")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate (default: 0.001)")
    
    args = parser.parse_args()
    
    # Set default data path if not provided
    if not args.data_path:
        args.data_path = f"data/{args.symbol.upper()}USDT_30m.csv"
        
    # Ensure data exists before training
    if not os.path.exists(args.data_path):
        print(f"Error: {args.data_path} not found. Please ensure the data directory and CSV files are present.")
    else:
        train(
            symbol=args.symbol,
            data_path=args.data_path,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr
        )
