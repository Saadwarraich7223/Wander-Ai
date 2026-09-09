"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "Travel Intelligence Platform"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str
    SYNC_DATABASE_URL: str | None = None

    # ── Auth / JWT ───────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # ── LLM Provider ─────────────────────────────────────────
    LLM_PROVIDER: Literal["gemini", "openai"] = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # ── Embedding ────────────────────────────────────────────
    EMBEDDING_PROVIDER: Literal["gemini", "openai"] = "gemini"
    EMBEDDING_DIMENSION: int = 768  # Gemini text-embedding-004=768, OpenAI small=1536

    # ── Maps ─────────────────────────────────────────────────
    MAPBOX_ACCESS_TOKEN: str | None = None

    # ── Weather ──────────────────────────────────────────────
    OPENWEATHER_API_KEY: str | None = None

    # ── Recommendation weights (configurable for research) ───
    REC_WEIGHT_INTEREST_MATCH: float = 0.35
    REC_WEIGHT_USER_HISTORY: float = 0.25
    REC_WEIGHT_POPULARITY: float = 0.15
    REC_WEIGHT_DISTANCE: float = 0.15
    REC_WEIGHT_BUDGET_FIT: float = 0.10

    # ── Collaborative filtering threshold ────────────────────
    # Minimum number of user interactions before CF is activated
    CF_MIN_INTERACTIONS: int = 10
    CF_MIN_USERS: int = 5

    # ── Itinerary defaults ───────────────────────────────────
    ITINERARY_DAY_START_HOUR: int = 9   # 09:00
    ITINERARY_DAY_END_HOUR: int = 21    # 21:00

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return v


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
