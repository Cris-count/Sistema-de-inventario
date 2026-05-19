"""Deterministic NLU regression tests (keyword + entity extraction only)."""

import pytest

from app.services.nlu_service import NLUService

NLU = NLUService()


def test_spanish_purchase_this_week_period():
    r = NLU.analyze("¿Qué productos debo comprar esta semana?")
    assert r.intent == "purchase_suggestion"
    assert r.language == "es"
    assert r.entities.get("period") == "this_week"
    assert r.filters.get("period") == "this_week"
    assert r.normalized_question == "que productos debo comprar esta semana"


def test_english_purchase_this_week_period():
    r = NLU.analyze("What products should I restock this week?")
    assert r.intent == "purchase_suggestion"
    assert r.language == "en"
    assert r.filters.get("period") == "this_week"


def test_spanish_stock_risk_critical_warehouse_principal():
    r = NLU.analyze("Muéstrame productos críticos de la bodega principal")
    assert r.intent == "stock_risk"
    assert r.language == "es"
    assert r.filters.get("risk_level") == "HIGH"
    assert r.filters.get("warehouse") == "bodega principal"


def test_english_sales_last_30_days():
    r = NLU.analyze("Summarize best-selling products in the last 30 days")
    assert r.intent == "sales_summary"
    assert r.language == "en"
    assert r.filters.get("period") == "last_30_days"


def test_movement_unusual_stock_movements():
    r = NLU.analyze("Are there unusual stock movements?")
    assert r.intent == "movement_analysis"


def test_action_request_spanish_stock_change():
    r = NLU.analyze("Cambia el stock del arroz a 100")
    assert "action_request" in r.safety_flags


@pytest.mark.parametrize("raw", ["", "   ", "\t"])
def test_blank_question_falls_back_assistant(raw: str):
    r = NLU.analyze(raw)
    assert r.intent == "inventory_assistant"
    assert r.language == "unknown"
