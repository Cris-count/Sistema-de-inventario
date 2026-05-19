"""
Application settings loaded from environment variables.

Future: Spring Boot will call this service with a service-to-service token; add
AUTH_VERIFY_JWT_ISSUER, shared secret, or OAuth2 resource-server settings here.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration (12-factor); override via env or `.env` file beside the process cwd."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    AI_SERVICE_NAME: str = "inventory-ai-service"
    AI_SERVICE_VERSION: str = "0.1.0"
    # Comma-separated list of origins, e.g. "http://localhost:4200,http://localhost:8080"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:4200"
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def strip_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    def cors_origin_list(self) -> list[str]:
        if not self.CORS_ALLOWED_ORIGINS.strip():
            return []
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
