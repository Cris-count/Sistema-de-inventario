"""Deterministic natural-language interpretation for inventory assistants."""

from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass

from app.schemas.nlu import NaturalLanguageUnderstandingResult


def _strip_accents(text: str) -> str:
    nkfd = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in nkfd if unicodedata.category(ch) != "Mn")


def normalize_for_match(text: str) -> str:
    """Lowercase, trim, collapse whitespace, strip accents."""
    lowered = text.lower().strip()
    collapsed = " ".join(lowered.split())
    return _strip_accents(collapsed)


def _pad(surface: str) -> str:
    """Pad token boundaries for substring lexical checks."""
    return f" {surface.strip()} "


def _canonical_flat(trim: str) -> str:
    """Normalize question for matching: accents, spacing, strip ¡¿? marks."""
    if not trim:
        return ""
    scrubbed = re.sub(r"[¿¡?]+", " ", trim)
    collapsed = " ".join(scrubbed.split())
    return normalize_for_match(collapsed)


_ACTION_ES_NEEDLES = [
    "elimina ",
    "borra ",
    "cambia el stock",
    "anula venta",
    "crea movimiento",
    "registra entrada",
    "registra salida",
]
_ACTION_EN_NEEDLES = [
    "delete ",
    "remove ",
    "change stock",
    "cancel sale",
    "create movement",
    "register inbound",
    "register outbound",
]

_ES_LANG = [
    ("esta semana", 3),
    ("este mes", 3),
    ("ultimos ", 3),
    ("cuales ", 3),
    ("cual ", 2),
    ("que ", 3),
    (" que ", 2),
    (" productos ", 3),
    (" comprar ", 4),
    (" ventas ", 3),
    (" inventario ", 3),
    (" bodega", 3),
    ("stock ", 1),
    (" movimientos ", 4),
    (" agotado", 4),
    (" reabastecer", 5),
]
_EN_LANG = [
    ("this week", 3),
    ("this month", 3),
    ("last month", 3),
    ("last ", 1),
    (" what ", 2),
    (" which ", 2),
    (" products ", 3),
    (" buy ", 3),
    (" purchase ", 3),
    (" sales ", 3),
    (" inventory ", 3),
    (" warehouse ", 3),
    (" stock ", 1),
    (" movements ", 3),
    (" reorder ", 3),
    (" restock ", 3),
]


_PURCHASE_NEEDLES = [
    ("orden de compra", 5),
    ("bajo stock", 9),
    ("agotarse", 7),
    ("agotado", 11),
    ("reponer", 13),
    ("reabastecer", 15),
    ("abastecer", 12),
    ("compras ", 16),
    ("compra ", 14),
    ("comprar", 17),
    ("low stock", 12),
    ("out of stock", 17),
    ("stockout", 15),
    ("replenish", 15),
    ("reorder", 17),
    ("restock", 17),
    ("purchase", 17),
    (" buy ", 15),
]


_SALES_NEEDLES = [
    ("mas vendidos", 16),
    ("facturacion", 13),
    ("ingresos", 15),
    ("vendidos", 15),
    ("vendido", 13),
    (" ventas ", 19),
    ("rotacion", 12),
    ("best-selling", 17),
    ("best selling", 17),
    ("turnover", 14),
    ("revenue", 15),
    (" sold ", 14),
    (" sales ", 19),
]


_STOCK_NEEDLES = [
    ("productos criticos", 21),
    (" critico ", 14),
    (" existencias ", 14),
    ("bajo inventario", 19),
    ("agotamiento", 17),
    ("riesgo de stock", 18),
    ("stock risk", 17),
    ("inventory shortage", 20),
    ("low inventory", 20),
    ("critical inventory", 20),
    ("critical stock", 20),
    ("high risk inventory", 17),
    ("riesgo alto", 12),
    ("riesgo medio", 8),
    ("riesgo ", 17),
]


_MOVEMENT_NEEDLES = [
    ("anomalias", 17),
    ("anomalies", 17),
    ("inusual", 15),
    ("inusuales", 15),
    ("unusual movements", 22),
    ("stock movements", 19),
    ("movements ", 16),
    ("movement ", 12),
    ("unusual inventory movement", 21),
    (" unusual ", 20),
    (" raro ", 14),
    (" raros ", 14),
    ("adjustments", 13),
    ("transfers ", 13),
    (" movimientos ", 20),
    ("transferencias ", 18),
    (" ajustes ", 12),
    (" entradas ", 13),
    (" salidas ", 13),
]


_PRODUCT_SEARCH_NEEDLES = [
    ("buscar producto", 30),
    ("encuentra producto", 28),
    ("producto parecido", 24),
    ("similar product", 28),
    ("find product", 30),
    ("search product", 30),
    (" similar to ", 26),
    ("parecido a ", 26),
    (" categoria ", 18),
    (" category ", 18),
]


_PERIOD_RULES = sorted(
    [
        ("ultimos 30 dias", "last_30_days"),
        ("ultimos 7 dias", "last_7_days"),
        ("hoy", "today"),
        ("ayer", "yesterday"),
        ("esta semana", "this_week"),
        ("semana pasada", "last_week"),
        ("este mes", "this_month"),
        ("mes pasado", "last_month"),
        ("last 30 days", "last_30_days"),
        ("last 7 days", "last_7_days"),
        ("today", "today"),
        ("yesterday", "yesterday"),
        ("this week", "this_week"),
        ("last week", "last_week"),
        ("this month", "this_month"),
        ("last month", "last_month"),
    ],
    key=lambda nv: len(nv[0]),
    reverse=True,
)


_RISK_RULES = sorted(
    [
        ("critical inventory", "HIGH"),
        ("productos criticos", "HIGH"),
        ("alta prioridad", "HIGH"),
        ("alto riesgo", "HIGH"),
        ("critical", "HIGH"),
        ("critico", "HIGH"),
        ("high priority", "HIGH"),
        ("high risk", "HIGH"),
        ("riesgo medio", "MEDIUM"),
        ("medium risk", "MEDIUM"),
        ("riesgo bajo", "LOW"),
        ("low risk", "LOW"),
    ],
    key=lambda nv: len(nv[0]),
    reverse=True,
)

_WAREHOUSE_NEEDLES_ES = [
    "bodega principal",
    "bodega norte",
    "bodega sur",
    "almacen principal",
]
_WAREHOUSE_NEEDLES_EN = [
    "main warehouse",
    "north warehouse",
    "south warehouse",
]


def _score_needles(padded: str, needles: list[tuple[str, int | float]]) -> float:
    total = 0.0
    for needle, weight in needles:
        n = needle.lower().strip()
        if not n:
            continue
        normalized_needle = normalize_for_match(n)
        if normalized_needle in padded:
            total += weight
    return total


def extract_product_hints(normalized_flat: str) -> tuple[str | None, str | None]:
    product_hint = None
    category_hint = None
    nf = normalized_flat

    mc = re.search(
        r"(?:categoria|category)\s+([a-z0-9\u00fc][a-z0-9\s\u00fc]{1,72}?)(?=\s|$)",
        nf,
    )
    if mc:
        category_hint = mc.group(1).strip()

    mp = re.search(
        r"(?:producto|product)\s+([a-z0-9\u00fc][a-z0-9\s\u00fc]{1,72}?)(?=\s|categoria|category|$)",
        nf,
    )
    if mp:
        product_hint = mp.group(1).strip()

    ms = re.search(
        r"(?:similar to|parecido a)\s+([a-z0-9\u00fc][a-z0-9\s\u00fc]{1,72}?)(?=\s|$)",
        nf,
    )
    if ms and not product_hint:
        product_hint = ms.group(1).strip()

    return product_hint, category_hint


@dataclass(frozen=True, slots=True)
class NLUService:
    _confidence_floor: float = 0.12
    _intent_threshold: float = 9.0

    def analyze(self, question: str) -> NaturalLanguageUnderstandingResult:
        original = question
        trim = question.strip()
        flat = _canonical_flat(trim)
        padded = _pad(flat) if trim else " "

        safety_flags = self._detect_action_flags(flat)

        if not trim:
            return NaturalLanguageUnderstandingResult(
                original_question=question,
                normalized_question="",
                language="unknown",
                intent="inventory_assistant",
                confidence=0.22,
                entities={},
                filters={},
                safety_flags=safety_flags,
            )

        language = self._detect_language(_pad(flat))

        entities: dict[str, object] = {}
        filters: dict[str, object] = {}

        period = self._extract_period(flat)
        if period:
            entities["period"] = period
            filters["period"] = period

        risk = self._extract_risk(flat)
        if risk:
            entities["risk_level"] = risk
            filters["risk_level"] = risk

        ware = self._warehouse_hint(flat)
        if ware:
            entities["warehouse"] = ware
            filters["warehouse"] = ware

        ph, ch = extract_product_hints(flat)
        if ph:
            entities["product_hint"] = ph
        if ch:
            entities["category_hint"] = ch

        intent_scores = {
            "purchase_suggestion": _score_needles(padded, _PURCHASE_NEEDLES),
            "sales_summary": _score_needles(padded, _SALES_NEEDLES),
            "stock_risk": _score_needles(padded, _STOCK_NEEDLES),
            "movement_analysis": _score_needles(padded, _MOVEMENT_NEEDLES),
            "product_search": _score_needles(padded, _PRODUCT_SEARCH_NEEDLES),
        }
        ordered = sorted(intent_scores.items(), key=lambda kv: (-kv[1], kv[0]))
        best_intent, best_score = ordered[0]
        second_score = ordered[1][1] if len(ordered) > 1 else 0.0

        if best_score < self._intent_threshold:
            chosen = "inventory_assistant"
            conf = min(0.88, max(self._confidence_floor, best_score / (self._intent_threshold + second_score)))
        else:
            chosen = best_intent
            denom = max(self._confidence_floor * 50, best_score + second_score + 1e-6)
            conf = min(0.97, max(0.58, best_score / denom))

        return NaturalLanguageUnderstandingResult(
            original_question=original,
            normalized_question=flat,
            language=language,
            intent=chosen,  # type: ignore[arg-type]
            confidence=round(float(conf), 2),
            entities=entities,
            filters=filters,
            safety_flags=safety_flags,
        )

    def _detect_language(self, padded_original_cased: str) -> str:
        p = padded_original_cased.lower()
        p = normalize_for_match(p)
        p = _pad(p)
        score_es = _score_needles(p, _ES_LANG)
        score_en = _score_needles(p, _EN_LANG)
        if math.isclose(score_es, score_en, abs_tol=0.51) or (score_es <= 0 and score_en <= 0):
            return "unknown"
        return "es" if score_es > score_en else "en"

    def _extract_period(self, flat: str) -> str | None:
        """flat is normalized (accent-less) single-line lowercase."""
        for needle, canon in _PERIOD_RULES:
            nk = normalize_for_match(needle)
            if nk in flat:
                return canon
        return None

    def _extract_risk(self, flat: str) -> str | None:
        surface = _pad(flat)
        for needle, level in _RISK_RULES:
            nk = normalize_for_match(needle.strip())
            if not nk:
                continue
            if f" {nk} " in surface:
                return level
        return None

    def _warehouse_hint(self, flat: str) -> str | None:
        pads = flat
        for phrase in sorted(_WAREHOUSE_NEEDLES_ES + _WAREHOUSE_NEEDLES_EN, key=len, reverse=True):
            nk = normalize_for_match(phrase)
            if nk in pads:
                return nk.replace("  ", " ").strip()
        return None

    def _detect_action_flags(self, flat_normalized: str) -> list[str]:
        pads = _pad(flat_normalized)
        for needle in _ACTION_ES_NEEDLES + _ACTION_EN_NEEDLES:
            n = normalize_for_match(needle.strip())
            if n and n in pads:
                return ["action_request"]
        return []

