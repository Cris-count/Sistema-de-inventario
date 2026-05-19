"""
Inventory AI Service — FastAPI entrypoint.

Orchestration notes:
- This process is intentionally isolated from the Angular and Spring Boot monolith.
- Spring Boot will later become the trusted broker: validate JWT, load tenant-scoped rows,
  and call this service with sanitized context + optional RAG snippets.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ai_routes, health_routes
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title="Inventory AI Service",
        version=settings.AI_SERVICE_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    origins = settings.cors_origin_list()
    if origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    application.include_router(health_routes.router)
    application.include_router(ai_routes.router)

    return application


app = create_app()
