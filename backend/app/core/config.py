import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustShift AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "trustshift-super-secure-production-ready-secret-key-replace-in-env-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12 # 12 hours
    CHALLENGE_EXPIRE_MINUTES: int = 10
    
    # Database
    DATABASE_URL: str = "sqlite:///./trustshift.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    ENVIRONMENT: str = "development"
    ENABLE_DEMO_PANEL: bool = True
    
    # Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
    REPORT_STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "reports")
    
    # Biometric / Provider Simulation Mode
    FACE_PROVIDER_MODE: str = "simulation"
    SIGNATURE_PROVIDER_MODE: str = "simulation"
    SMS_PROVIDER_MODE: str = "simulation"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
os.makedirs(settings.REPORT_STORAGE_DIR, exist_ok=True)
