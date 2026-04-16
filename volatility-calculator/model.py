import torch
import torch.nn as nn
import torch.nn.functional as F

class VolatilityModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=64):
        super(VolatilityModel, self).__init__()
        
        # Shared Feature Extractor (1D-CNN)
        self.conv1 = nn.Conv1d(input_dim, hidden_dim, kernel_size=5, padding=2)
        self.conv2 = nn.Conv1d(hidden_dim, hidden_dim * 2, kernel_size=3, padding=1)
        self.pool = nn.AdaptiveAvgPool1d(1)
        
        # Dense layers after pooling
        self.fc_shared = nn.Linear(hidden_dim * 2, hidden_dim)
        
        # Volatility Head (Regression)
        self.vol_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim) -> (batch, input_dim, seq_len)
        x = x.transpose(1, 2)
        
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = self.pool(x).squeeze(-1) # (batch, hidden_dim * 2)
        
        x = F.relu(self.fc_shared(x))
        
        vol_out = self.vol_head(x).squeeze(-1) # (batch,)
        
        return vol_out

def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
