import torch
import torch.onnx
from model import VolatilityModel
import argparse
import os

def export_onnx(symbol):
    symbol_lower = symbol.lower()
    model_path = f"{symbol_lower}_best_volatility_model.pth"
    onnx_path = f"{symbol_lower}_volatility_model.onnx"
    
    if not os.path.exists(model_path):
        # Try without 'best' if not found
        model_path = f"{symbol_lower}_volatility_model.pth"
        if not os.path.exists(model_path):
            print(f"Error: Model file for {symbol} not found.")
            return

    print(f"Loading weights from {model_path}...")
    
    # Model architecture params
    input_dim = 6
    device = torch.device("cpu")
    model = VolatilityModel(input_dim).to(device)
    
    # Load state dict
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    
    # Prepare dummy input
    # Shape: (batch_size, sequence_length, features)
    # The models were trained with window_size=1440 and input_dim=6
    dummy_input = torch.randn(1, 1440, input_dim).to(device)
    
    print(f"Exporting to {onnx_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"ONNX model saved to {onnx_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX.")
    parser.add_argument("--symbol", type=str, required=True, help="Asset symbol (e.g., BTC, ETH)")
    args = parser.parse_args()
    export_onnx(args.symbol)
