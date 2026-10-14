import os
from pathlib import Path
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
ML_DIR = BASE_DIR / "ml"
MODELS_DIR = ML_DIR / "models"
DB_PATH = BASE_DIR / "data" / "aegisx.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)
ML_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "AEGISX AI Cybersecurity Intelligence Platform"
    app_version: str = "1.0.0"
    environment: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    debug: bool = Field(default_factory=lambda: os.getenv("DEBUG", "true").lower() in ("true", "1"))
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}"))
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*",
    ]
    jwt_secret: str = Field(default_factory=lambda: os.getenv("JWT_SECRET", "aegisx-enterprise-cyber-secret-key-2026"))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    # LLM Gateway settings
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    anthropic_api_key: str = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    simulation_mode: bool = True  # Defensive actions executed in safe simulation sandbox

settings = Settings()
