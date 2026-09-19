"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Any, Literal

from pydantic import AnyHttpUrl, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        """Strip out empty string environment variables so defaults apply seamlessly."""
        if isinstance(data, dict):
            return {
                k: v
                for k, v in data.items()
                if not (isinstance(v, str) and v.strip() == "")
            }
        return data

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "Travel Intelligence Platform"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./dev.db"
    SYNC_DATABASE_URL: str | None = "sqlite:///./dev.db"

    # ── Auth / JWT ───────────────────────────────────────────
    JWT_SECRET_KEY: str = "wander_ai_default_secret_jwt_key_2026_secure_32_characters_minimum"
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

    @field_validator(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "REFRESH_TOKEN_EXPIRE_DAYS",
        "EMBEDDING_DIMENSION",
        "REC_WEIGHT_INTEREST_MATCH",
        "REC_WEIGHT_USER_HISTORY",
        "REC_WEIGHT_POPULARITY",
        "REC_WEIGHT_DISTANCE",
        "REC_WEIGHT_BUDGET_FIT",
        "CF_MIN_INTERACTIONS",
        "CF_MIN_USERS",
        "ITINERARY_DAY_START_HOUR",
        "ITINERARY_DAY_END_HOUR",
        mode="before",
    )
    @classmethod
    def clean_numeric_fields(cls, v: Any, info) -> Any:
        if isinstance(v, str) and not v.strip():
            return cls.model_fields[info.field_name].default
        return v

    @field_validator("LLM_PROVIDER", "EMBEDDING_PROVIDER", "ENVIRONMENT", mode="before")
    @classmethod
    def clean_literal_fields(cls, v: Any, info) -> Any:
        if isinstance(v, str) and not v.strip():
            return cls.model_fields[info.field_name].default
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or not v.strip():
            return "sqlite+aiosqlite:///./dev.db"
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def validate_sync_database_url(cls, v: str | None) -> str | None:
        if not v or not v.strip():
            return "sqlite:///./dev.db"
        if v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql+asyncpg://", "postgresql://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("JWT_SECRET_KEY", mode="before")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if not v or not v.strip() or len(v.strip()) < 32:
            return "wander_ai_default_secret_jwt_key_2026_secure_32_characters_minimum"
        return v


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
