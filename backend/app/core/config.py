import os
from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SeatFlow AI"
    API_V1_STR: str = "/api/v1"
    
    # Postgres is default based on PRD, but provide sqlite fallback if missing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/seatflow")
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://seatflow-ai.vercel.app",
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
