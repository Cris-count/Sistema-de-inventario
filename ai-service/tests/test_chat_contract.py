"""Contract checks aligned with Spring Boot outbound JSON (snake_case)."""

import pytest

MIN_BODY = {
    "company_id": 1,
    "user_id": 1,
    "role": "ADMIN",
    "question": "Hello",
    "context": {"products": [], "stock": [], "sales": [], "movements": []},
}


def test_chat_accepts_snake_case_request(client):
    r = client.post("/api/v1/ai/chat", json=MIN_BODY)
    assert r.status_code == 200
    data = r.json()
    assert "answer" in data
    assert "intent" in data
    assert "confidence" in data
    assert "used_context" in data
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


@pytest.mark.parametrize(
    ("question", "expected_intent"),
    [
        ("We need to restock urgently", "purchase_suggestion"),
        ("Analyze our sales revenue", "sales_summary"),
        ("Stock risk below minimum", "stock_risk"),
        ("Recent inventory transfers and movements", "movement_analysis"),
        ("General inventory overview", "inventory_assistant"),
    ],
)
def test_chat_intents_deterministic(client, question: str, expected_intent: str):
    body = {**MIN_BODY, "question": question}
    r = client.post("/api/v1/ai/chat", json=body)
    assert r.status_code == 200
    assert r.json()["intent"] == expected_intent


def test_recommendation_includes_aliases_for_java(client):
    body = {
        **MIN_BODY,
        "question": "stock risk audit",
        "context": {
            "products": [],
            "stock": [
                {
                    "productId": 1,
                    "productName": "X",
                    "currentStock": 1,
                    "warehouseName": "W",
                    "minimumStock": 10,
                    "riskLevel": "HIGH",
                }
            ],
            "sales": [],
            "movements": [],
        },
    }
    r = client.post("/api/v1/ai/chat", json=body)
    assert r.status_code == 200
    recs = r.json().get("recommendations") or []
    assert len(recs) >= 1
    row = recs[0]
    assert row.get("code") or row.get("type")
    assert row.get("detail") or row.get("description")
