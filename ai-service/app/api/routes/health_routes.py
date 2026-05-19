"""Liveness / readiness style health check (no dependency on Spring or PostgreSQL)."""

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    s = get_settings()
    return {
        "status": "ok",
        "service": s.AI_SERVICE_NAME,
        "version": s.AI_SERVICE_VERSION,
    }
