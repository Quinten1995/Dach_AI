from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Anthropic
    ANTHROPIC_API_KEY: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # App
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://dachprofi.vercel.app",
    ]
    MAX_PHOTOS: int = 5
    MAX_AUDIO_SECONDS: int = 90

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
