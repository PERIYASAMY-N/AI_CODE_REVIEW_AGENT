from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve the .env path relative to this file so it works regardless of CWD
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Code Review Agent"
    PROJECT_VERSION: str = "1.0.0"

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: str = ""
    AI_MODEL: str = "llama-3.3-70b-versatile"  # Default; override via AI_MODEL env var
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")

settings = Settings()
