"""Schemas for the AI chat API. validated at the HTTP boundary."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, computed_field


class AIRecommendation(BaseModel):
    """
    Structured recommendation compatible with Spring `AiPythonRecommendationPayload`:
    exposes `code`/`detail` (canonical) plus `type`/`description` mirrors for deserialization aliases.
    """

    code: str = Field(..., description="Stable machine-readable key")
    title: str
    detail: str
    priority: str | None = Field(default=None, description="low | medium | high")
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    metadata: dict[str, Any] | None = None

    @computed_field
    @property
    def type(self) -> str:
        return self.code

    @computed_field
    @property
    def description(self) -> str:
        return self.detail


class AIContext(BaseModel):
    """
    Optional enterprise context supplied by Spring Boot only (never trusted from browsers).

    Keys align with Spring `AIContextDto` serialization.
    """

    products: list[dict[str, Any]] = Field(default_factory=list)
    stock: list[dict[str, Any]] = Field(default_factory=list)
    sales: list[dict[str, Any]] = Field(default_factory=list)
    movements: list[dict[str, Any]] = Field(default_factory=list)


class AIChatRequest(BaseModel):
    """Chat request scoped to a company and user."""

    company_id: int = Field(..., ge=1)
    user_id: int = Field(..., ge=1)
    role: str = Field(..., min_length=1, max_length=64)
    question: str = Field(..., min_length=1, max_length=16_000)
    context: AIContext = Field(default_factory=AIContext)


class AIChatResponse(BaseModel):
    """Assistant reply and metadata for observability and UI."""

    answer: str
    intent: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    used_context: bool
    recommendations: list[AIRecommendation] = Field(default_factory=list)
