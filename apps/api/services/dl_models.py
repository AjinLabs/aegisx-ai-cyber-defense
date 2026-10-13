import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from pathlib import Path
from apps.api.config import MODELS_DIR
from apps.api.services.ml_models import extract_features, generate_synthetic_training_data

DL_MODEL_PATH = MODELS_DIR / "pytorch_autoencoder_v1.pt"

class CyberAutoencoder(nn.Module):
    def __init__(self, input_dim: int = 8, latent_dim: int = 3):
        super(CyberAutoencoder, self).__init__()
        # Encoder: compress normal behavioral features to bottleneck
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.BatchNorm1d(16),
            nn.LeakyReLU(0.1),
            nn.Linear(16, 8),
            nn.LeakyReLU(0.1),
            nn.Linear(8, latent_dim)
        )
        # Decoder: reconstruct canonical feature vector
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 8),
            nn.LeakyReLU(0.1),
            nn.Linear(8, 16),
            nn.LeakyReLU(0.1),
            nn.Linear(16, input_dim)
        )

    def forward(self, x):
        latent = self.encoder(x)
        reconstructed = self.decoder(latent)
        return reconstructed

class DLRegistry:
    _instance = None

    def __init__(self):
        self.model: CyberAutoencoder | None = None
        self.threshold: float = 0.45
        self.metrics: dict = {}
        self.load_or_train_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DLRegistry()
        return cls._instance

    def load_or_train_model(self):
        """Load PyTorch checkpoint or train new autoencoder."""
        if DL_MODEL_PATH.exists():
            try:
                checkpoint = torch.load(DL_MODEL_PATH, map_location=torch.device("cpu"), weights_only=False)
                self.model = CyberAutoencoder()
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.eval()
                self.threshold = checkpoint.get("threshold", 0.45)
                self.metrics = checkpoint.get("metrics", {})
                return
            except Exception:
                pass
        
        self.train_autoencoder()

    def train_autoencoder(self, epochs: int = 25, lr: float = 0.005):
        """Train Autoencoder on normal telemetry to detect anomalous reconstruction errors."""
        torch.manual_seed(42)
        X, y = generate_synthetic_training_data(1500)
        
        # Train strictly on normal events (unsupervised anomaly detection)
        X_normal = X[y == 0]
        split = int(0.85 * len(X_normal))
        X_train = torch.tensor(X_normal[:split], dtype=torch.float32)
        X_val = torch.tensor(X_normal[split:], dtype=torch.float32)
        
        # Attack validation set to evaluate detection performance
        X_attack = torch.tensor(X[y == 1], dtype=torch.float32)
        
        model = CyberAutoencoder(input_dim=8, latent_dim=3)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
        
        batch_size = 32
        dataset = torch.utils.data.TensorDataset(X_train)
        loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        model.train()
        losses = []
        for epoch in range(epochs):
            epoch_loss = 0.0
            for batch in loader:
                inputs = batch[0]
                optimizer.zero_grad()
                outputs = model(inputs)
                loss = criterion(outputs, inputs)
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item()
            losses.append(epoch_loss / len(loader))
            
        model.eval()
        with torch.no_grad():
            # Calculate validation reconstruction errors on normal events
            val_preds = model(X_val)
            val_errors = torch.mean((X_val - val_preds) ** 2, dim=1).numpy()
            # Set threshold at 95th percentile of normal reconstruction error
            calibrated_threshold = float(np.percentile(val_errors, 95))
            
            # Evaluate on attack events
            attack_preds = model(X_attack)
            attack_errors = torch.mean((X_attack - attack_preds) ** 2, dim=1).numpy()
            
            # Metric evaluation
            y_true = np.concatenate([np.zeros(len(val_errors)), np.ones(len(attack_errors))])
            all_errors = np.concatenate([val_errors, attack_errors])
            y_pred = (all_errors >= calibrated_threshold).astype(int)
            
            from sklearn.metrics import precision_score, recall_score, f1_score
            prec = float(precision_score(y_true, y_pred, zero_division=0))
            rec = float(recall_score(y_true, y_pred, zero_division=0))
            f1 = float(f1_score(y_true, y_pred, zero_division=0))
            
        self.model = model
        self.threshold = round(calibrated_threshold, 4)
        self.metrics = {
            "model_architecture": "PyTorch Deep Cyber Autoencoder (8 -> 16 -> 8 -> 3 -> 8 -> 16 -> 8)",
            "final_epoch_loss": round(losses[-1], 6),
            "reconstruction_threshold": self.threshold,
            "val_normal_error_mean": round(float(np.mean(val_errors)), 5),
            "attack_error_mean": round(float(np.mean(attack_errors)), 5),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "epochs_trained": epochs,
        }
        
        torch.save({
            "model_state_dict": model.state_dict(),
            "threshold": self.threshold,
            "metrics": self.metrics
        }, DL_MODEL_PATH)
        
        return self.metrics

    def predict_reconstruction_error(self, event: dict) -> dict:
        """Run deep learning reconstruction inference on event features."""
        features = extract_features(event).reshape(1, -1)
        x_tensor = torch.tensor(features, dtype=torch.float32)
        
        error = 0.05
        is_dl_anomaly = False
        if self.model:
            self.model.eval()
            with torch.no_grad():
                reconstructed = self.model(x_tensor)
                mse = torch.mean((x_tensor - reconstructed) ** 2).item()
                error = float(mse)
                is_dl_anomaly = bool(error > self.threshold)
                
        # Normalized DL confidence score [0, 1]
        dl_score = min(1.0, max(0.0, error / (self.threshold * 2.0 + 1e-6)))
        
        return {
            "reconstruction_error": round(error, 5),
            "threshold": self.threshold,
            "is_dl_anomaly": is_dl_anomaly,
            "dl_confidence_score": round(dl_score, 4)
        }

dl_registry = DLRegistry.get_instance()
