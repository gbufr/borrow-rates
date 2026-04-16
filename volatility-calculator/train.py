import torch
import torch.nn as nn
import torch.optim as optim
from data_utils import get_dataloaders
from model import VolatilityModel
import os
import numpy as np
import joblib

# Training params
BATCH_SIZE = 64
EPOCHS = 10
LR = 0.001
FILE_PATH = "data/BTCUSDT_30m.csv"
MODEL_PATH = "volatility_model.pth"
BEST_MODEL_PATH = "best_volatility_model.pth"
CHECKPOINT_DIR = "checkpoints"

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load data
    train_loader, test_loader, scaler = get_dataloaders(FILE_PATH, batch_size=BATCH_SIZE)
    
    # Ensure checkpoint directory exists
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    
    # Initialize model
    input_dim = 6 # [returns, vol_30, vol_100, ret_1h, ret_4h, ret_24h]
    model = VolatilityModel(input_dim).to(device)
    
    # Loss function
    vol_criterion = nn.MSELoss()
    
    optimizer = optim.Adam(model.parameters(), lr=LR)
    
    best_loss = float('inf')

    for epoch in range(EPOCHS):
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
        correct_dir = 0
        total = 0
        
        with torch.no_grad():
            for X, y_vol in test_loader:
                X, y_vol = X.to(device), y_vol.to(device)
                vol_pred = model(X)
                
                loss = vol_criterion(vol_pred, y_vol)
                val_losses.append(loss.item())

        avg_train_loss = np.mean(train_losses)
        avg_val_loss = np.mean(val_losses)
        
        print(f"Epoch [{epoch+1}/{EPOCHS}], Train Loss: {avg_train_loss:.8f}, Val Loss: {avg_val_loss:.8f}")
        
        if avg_val_loss < best_loss:
            best_loss = avg_val_loss
            # Save the latest best model
            torch.save(model.state_dict(), BEST_MODEL_PATH)
            
            # Also keep a copy in the checkpoint directory
            checkpoint_path = os.path.join(CHECKPOINT_DIR, f"best_model_loss_{best_loss:.8f}.pth")
            torch.save(model.state_dict(), checkpoint_path)
            
            print(f"New best model saved to {BEST_MODEL_PATH} and {checkpoint_path}")
    
    # Save the current model state (last epoch)
    torch.save(model.state_dict(), MODEL_PATH)
    
    # Save the scaler for inference
    joblib.dump(scaler, "scaler.joblib")
    print("Scaler saved to scaler.joblib")

    print("Training complete!")

if __name__ == "__main__":
    # Ensure data exists before training
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} not found. Please ensure the data directory and CSV files are present.")
    else:
        train()
