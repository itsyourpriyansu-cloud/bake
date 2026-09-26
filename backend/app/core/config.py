from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = (
    f"sqlite+pysqlite:///{(Path(__file__).resolve().parents[2] / 'pizza_wave.db').as_posix()}"
)


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = DEFAULT_DATABASE_URL
    cors_origins: list[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ]
    auto_create_schema: bool = True
    seed_demo_data: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PIZZA_WAVE_",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
