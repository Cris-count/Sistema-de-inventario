"""
AI HTTP surface.

Future Spring Boot integration:
- Add a dependency that validates `Authorization: Bearer <token>` minted by the main API,
  or accept an internal `X-Service-Auth` secret for server-to-server calls.
- Forward `company_id` only if it matches the JWT tenant claim (never trust raw body alone).
"""

from fastapi import APIRouter

from app.schemas.ai_schema import AIChatRequest, AIChatResponse
from app.services.ai_service import process_chat

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse)
def chat(payload: AIChatRequest) -> AIChatResponse:
    """
    Placeholder assistant endpoint (no external LLM).

    Future: stream tokens, attach trace ids, persist audit per company_id for compliance.
    """
    return process_chat(payload)
