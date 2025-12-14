from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API keys are optional in .env since they can be provided via frontend
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Don't raise error if .env file doesn't exist
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
