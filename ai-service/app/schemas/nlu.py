"""Structured NLU output (deterministic rules, no ML)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

NluidLanguage = Literal["es", "en", "unknown"]
NluidIntent = Literal[
    "purchase_suggestion",
    "sales_summary",
    "stock_risk",
    "movement_analysis",
    "product_search",
    "inventory_assistant",
]


class NaturalLanguageUnderstandingResult(BaseModel):
    """Interpretation of a tenant question produced without external APIs."""

    original_question: str = Field(..., description="verbatim user phrase")
    normalized_question: str = Field(
        ..., description="lowercased, accent-stripped helper used for lexical matching only"
    )
    language: NluidLanguage
    intent: NluidIntent
    confidence: float = Field(ge=0.0, le=1.0)
    entities: dict[str, Any] = Field(default_factory=dict)
    filters: dict[str, Any] = Field(default_factory=dict)
    safety_flags: list[str] = Field(default_factory=list)
