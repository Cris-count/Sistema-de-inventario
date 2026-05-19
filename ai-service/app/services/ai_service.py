"""
Inventory assistant pipeline: deterministic NLU + bounded recommendations.

Intents surfaced: purchase_suggestion, sales_summary, stock_risk,
movement_analysis, product_search, inventory_assistant (no outbound LLMs).
"""

from __future__ import annotations

from app.schemas.ai_schema import AIChatRequest, AIChatResponse, AIRecommendation
from app.schemas.nlu import NaturalLanguageUnderstandingResult
from app.services.nlu_service import NLUService

NLU = NLUService()


def _context_nonempty(req: AIChatRequest) -> bool:
    ctx = req.context
    return any((ctx.products, ctx.stock, ctx.sales, ctx.movements))


def _nlu_public_meta(nlu: NaturalLanguageUnderstandingResult) -> dict[str, object]:
    return {
        k: v
        for k, v in {
            "language": nlu.language,
            "period": nlu.filters.get("period"),
            "risk_level": nlu.filters.get("risk_level"),
            "warehouse": nlu.filters.get("warehouse"),
        }.items()
        if v not in (None, "", [])
    }


def _merge_meta(*, base: dict | None, nlu: dict[str, object] | None) -> dict[str, object]:
    out = dict(base or {})
    if nlu:
        out["nlu"] = nlu
    return out


def _safety_banner(flags: list[str]) -> str:
    if not flags:
        return ""
    if "action_request" in flags:
        return (
            "I cannot execute inventory or sales changes from this assistant. "
            "Any stock adjustment, cancellation, or document creation must be reviewed and "
            "submitted through the approved SaaS workflows with proper authorization.\n\n"
        )
    return ""


def _answer_body(
    intent: str,
    *,
    used_context: bool,
    nlu: NaturalLanguageUnderstandingResult,
    req: AIChatRequest,
) -> str:
    ctx_note = (
        "The payload only reflects the sanitized tenant slice your organization already shared through Spring Boot."
        if used_context
        else "No structured context lists were attached; guide the user to refresh operational views in the main app."
    )

    period = nlu.filters.get("period")
    risk = nlu.filters.get("risk_level")
    warehouse = nlu.filters.get("warehouse")

    period_sales = (
        " The sales array (when present) is pre-aggregated by the backend for the window stated on each row — "
        "typically `last_30_days` unless the platform changes that contract."
    )
    period_move = (
        " Movement lines are exactly what the backend attached; if you need a different window, adjust filters in the core app."
    )

    filter_bits: list[str] = []
    if period:
        filter_bits.append(f"interpreted period hint: `{period}`")
    if risk:
        filter_bits.append(f"risk focus: `{risk}`")
    if warehouse:
        filter_bits.append(f"warehouse hint: `{warehouse}`")
    filter_line = f" ({'; '.join(filter_bits)})" if filter_bits else ""

    answers: dict[str, str] = {
        "purchase_suggestion": (
            "Plan replenishment against service-level constraints for each SKU × warehouse pairing. "
            "Validate demand using the sanitized stock runway table and escalate to purchasing only after policy checks "
            + ctx_note
            + filter_line
        ),
        "sales_summary": (
            "Review velocity using the sanitized sales ranking lines provided upstream—do not invent SKUs absent from JSON."
            + period_sales
            + " "
            + ctx_note
            + filter_line
        ),
        "stock_risk": (
            "Prioritize SKU/warehouse tuples aligning with expressed risk thresholds; escalate only after human confirmation."
            + " "
            + ctx_note
            + filter_line
        ),
        "movement_analysis": (
            "Interpret recent operational motions strictly from the movement lines supplied."
            + period_move
            + " Statistical anomalies can flag items for reconciliation, "
            "but never speculate about misconduct—treat outliers as bookkeeping or process issues until reviewed."
            + " "
            + ctx_note
            + filter_line
        ),
        "product_search": (
            "Narrow catalogue rows using lexical hints interpreted from the utterance (`product_hint`, `category_hint`). "
            "Match against sanitized `products` entries only — there is still no fuzzy database search enabled."
            + " "
            + ctx_note
            + filter_line
        ),
        "inventory_assistant": (
            "Provide neutral operational guidance anchored to sanitized lists supplied by Spring Boot tenants."
            + " "
            + ctx_note
        ),
    }

    ans = answers.get(intent, answers["inventory_assistant"])

    if nlu.entities.get("product_hint") or nlu.entities.get("category_hint"):
        hint_parts: list[str] = []
        if nlu.entities.get("product_hint"):
            hint_parts.append(f"product_hint=`{nlu.entities['product_hint']}`")
        if nlu.entities.get("category_hint"):
            hint_parts.append(f"category_hint=`{nlu.entities['category_hint']}`")
        ans += " NLU lexical hints captured: " + ", ".join(hint_parts) + "."

    return ans


def _risk_priority(level: object) -> str:
    if level is None:
        return "medium"
    text = str(level).upper().strip()
    if text == "HIGH":
        return "high"
    if text == "MEDIUM":
        return "medium"
    return "low"


def _reco_from_stock(ctx_stock: list[dict], *, nlu: NaturalLanguageUnderstandingResult) -> list[AIRecommendation]:
    recos: list[AIRecommendation] = []
    nlu_blob = _nlu_public_meta(nlu)
    want_high = str(nlu.filters.get("risk_level", "")).upper() == "HIGH"

    risky = []
    if want_high:
        risky = [
            row
            for row in ctx_stock
            if str(row.get("riskLevel", row.get("risk_level", ""))).upper() == "HIGH"
        ]
    else:
        risky = [
            row
            for row in ctx_stock
            if str(row.get("riskLevel", row.get("risk_level", ""))).upper()
            in ("HIGH", "MEDIUM", "")
        ]

    risky = sorted(risky, key=lambda r: float(r.get("currentStock") or 0))

    filter_wh = str(nlu.filters.get("warehouse", "")).lower()
    if filter_wh:
        risky = [
            r
            for r in risky
            if filter_wh in str(r.get("warehouseName", "") or "").lower().replace("_", " ")
            or filter_wh == str(r.get("warehouseName", "")).strip().lower()
        ]

    for row in risky[:3]:
        pid = row.get("productId")
        code = f"RESTOCK_SKU_{pid}" if pid is not None else "RESTOCK_CRITICAL"
        recos.append(
            AIRecommendation(
                code=code,
                title="Stock posture review",
                detail=(
                    f"SKU {pid} at `{row.get('warehouseName') or '?'}` needs human validation against policy minimums "
                    "(deterministic heuristic only)."
                ),
                priority=_risk_priority(row.get("riskLevel")),
                confidence=0.66,
                metadata=_merge_meta(
                    base={"product_id": pid, "risk_level": row.get("riskLevel")},
                    nlu=nlu_blob or None,
                ),
            )
        )
    return recos


def _reco_from_sales_movements(intent: str, req: AIChatRequest, *, nlu: NaturalLanguageUnderstandingResult) -> list[AIRecommendation]:
    recos: list[AIRecommendation] = []
    blob = _nlu_public_meta(nlu)
    if intent == "sales_summary" and req.context.sales:
        leader = req.context.sales[0]
        pid = leader.get("productId")
        recos.append(
            AIRecommendation(
                code="SALES_FOCUS",
                title="Top SKU momentum snapshot",
                detail=(
                    f"Product `{pid}` currently leads the sanitized ranking; corroborate with finance before reordering decisions."
                ),
                priority="medium",
                confidence=0.62,
                metadata=_merge_meta(
                    base={"product_id": pid, "sales_period": leader.get("period")},
                    nlu=blob or None,
                ),
            )
        )
    if intent == "movement_analysis" and req.context.movements:
        mv = req.context.movements[0]
        mid = mv.get("movementId")
        recos.append(
            AIRecommendation(
                code=f"MOV_{mid or 'RECENT'}",
                title="Review attached movement envelope",
                detail=(
                    "Use the sanitized movement line purely for explanation—no automated reversals occur from this assistant."
                ),
                priority="medium",
                confidence=0.52,
                metadata=_merge_meta(
                    base={"movement_id": mid},
                    nlu=blob or None,
                ),
            )
        )
    return recos


def _reco_product_search(req: AIChatRequest, nlu: NaturalLanguageUnderstandingResult) -> list[AIRecommendation]:
    if not req.context.products:
        return []
    hints = []
    ph = nlu.entities.get("product_hint")
    ch = nlu.entities.get("category_hint")
    if ph:
        hints.append(("product lexical hint", str(ph)))
    if ch:
        hints.append(("category lexical hint", str(ch)))
    if not hints:
        return []
    recos = []
    for label, needle in hints:
        needle_l = needle.lower()
        ranked = sorted(
            (
                row
                for row in req.context.products
                if needle_l in str(row.get("name", "")).lower()
                or needle_l in str(row.get("sku", "")).lower()
                or needle_l in str(row.get("category", "")).lower()
            ),
            key=lambda row: row.get("id"),
        )[:5]
        if not ranked:
            recos.append(
                AIRecommendation(
                    code=f"SCOPE_GAP_{hash(needle)%10000}",
                    title="Lexical mismatch",
                    detail=f"No catalogue entries matched `{needle}` locally—confirm spelling in ERP.",
                    priority="medium",
                    confidence=0.35,
                    metadata=_merge_meta(
                        base={"hint_type": label, "hint_value": needle},
                        nlu=_nlu_public_meta(nlu) or None,
                    ),
                )
            )
            continue

        pid = ranked[0].get("id")
        recos.append(
            AIRecommendation(
                code=f"MATCH_PRIMARY_{pid}",
                title=f"Potential {label}",
                detail=f"Heuristic match anchored on sanitized row id `{pid}`. Requires human verification.",
                priority="low",
                confidence=0.43,
                metadata=_merge_meta(
                    base={"product_id": pid, "hint": needle},
                    nlu=_nlu_public_meta(nlu) or None,
                ),
            )
        )
    return recos


def process_chat(req: AIChatRequest) -> AIChatResponse:
    """
    Deterministic NL-first pipeline; recommendations remain compact for WebClient safety.
    """
    nlu = NLU.analyze(req.question.strip() or "")
    intent = str(nlu.intent)
    used_context = _context_nonempty(req)

    answer = (
        _safety_banner(nlu.safety_flags)
        + _answer_body(intent, used_context=used_context, nlu=nlu, req=req)
    )

    confidence = float(max(0.0, min(1.0, nlu.confidence)))

    recommendations: list[AIRecommendation] = []
    recommendations.extend(_reco_from_stock(list(req.context.stock), nlu=nlu))
    recommendations.extend(_reco_from_sales_movements(intent, req, nlu=nlu))

    if intent == "purchase_suggestion" and req.context.stock:
        low = sorted(req.context.stock, key=lambda r: float(r.get("currentStock") or 0))[:2]
        nb = _nlu_public_meta(nlu) or {}
        for row in low:
            pid = row.get("productId")
            recommendations.append(
                AIRecommendation(
                    code=f"PO_CANDIDATE_{pid}",
                    title="Reorder candidate preview",
                    detail="Treat as exploratory—confirm coverage with replenishment workflows before issuing POs.",
                    priority=_risk_priority(row.get("riskLevel")),
                    confidence=0.48,
                    metadata=_merge_meta(base={"product_id": pid}, nlu=nb or None),
                )
            )

    if intent == "product_search":
        recommendations.extend(_reco_product_search(req, nlu))

    recommendations = recommendations[:7]

    return AIChatResponse(
        answer=answer,
        intent=intent,
        confidence=confidence,
        used_context=used_context,
        recommendations=recommendations,
    )
