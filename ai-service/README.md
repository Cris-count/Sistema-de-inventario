# Inventory AI Service

Standalone **FastAPI** microservice that will host inventory intelligence features (assistant, recommendations, forecasting, RAG) **without coupling** to the Angular client or Spring Boot monolith in this phase.

## Run locally

Prerequisites: Python 3.12+

```bash
cd ai-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows — or: cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables are documented in `.env.example`. `CORS_ALLOWED_ORIGINS` is a comma-separated list.

## Entornos (`AI_SERVICE_*` y CORS)

Las claves en `.env.example` (y variables en Docker Compose) ya las consume `app/core/config.py` para nombre, versión y CORS.

## Contrato JSON con Spring Boot (snake_case)

- **Entrada `POST /api/v1/ai/chat`:** `company_id`, `user_id`, `role`, `question`, `context` con `products`, `stock`, `sales`, `movements` (listas de objetos heterogéneos).
- **Respuesta:** `answer`, `intent` (`purchase_suggestion` \| `sales_summary` \| `stock_risk` \| `movement_analysis` \| `product_search` \| `inventory_assistant`), `confidence`, `used_context`, `recommendations`.
- Cada recomendación expone `code` + `detail` (canónicos) y espejos `type` / `description` (mismo valor) para compatibilidad con DTOs Java.

## Natural Language Understanding

La capa NLU del servicio es **determinista** (sin LLM externo): normaliza el texto, estima **idioma** (`es` \| `en` \| `unknown`), asigna **intención** usando pesos por frases clave y rellena **entidades** opcionales (`period`, `risk_level`, `warehouse`, `product_hint`, `category_hint`) en paralelo en `entities` y `filters` para reglas posteriores.

- **Idiomas:** español e inglés mediante conteo ponderado de marcadores léxicos (empate o sin señales → `unknown`).
- **Ejecución:** no se ejecutan acciones sobre inventario ni ventas desde el asistente.
- **Pedidos de modificación:** preguntas tipo “borra”, “cambia el stock”, “crea movimiento”, etc. disparan la bandera interna `action_request`; la respuesta exige flujos humanos y aprobados en el SaaS.
- **Movimientos:** el análisis usa solo el contexto sanitizado y evita inferir fraude o hurtos.
- **Contrato HTTP:** el resultado NLU completo no se expone en la respuesta pública de `/api/v1/ai/chat` (compatibilidad); metadatos **no sensibles** pueden aparecer dentro de `recommendations[].metadata.nlu` cuando aplica.

## Docker (full stack)

From the repository root:

```bash
docker compose up -d --build ai-service api
```

Nota: el contenedor backend se llama de servicio **`api`** (no `backend`). El hostname interno del microservicio de IA es **`ai-service`** (mismo nombre que la clave en `docker-compose.yml`).

Asegúrate de que la API Spring arranque con `AI_SERVICE_URL=http://ai-service:8000` (es el valor por defecto del `docker-compose.yml` actual).

### Probar salud

```bash
curl -s http://localhost:8000/health
```

## Test URLs

| Endpoint | Method | Notes |
|----------|--------|--------|
| http://localhost:8000/health | GET | JSON status + version |
| http://localhost:8000/docs | GET | Swagger UI |
| http://localhost:8000/api/v1/ai/chat | POST | Placeholder assistant (JSON body below) |

### Health example

```bash
curl -s http://localhost:8000/health
```

Expected shape:

```json
{"status":"ok","service":"inventory-ai-service","version":"0.1.0"}
```

### Chat example

```bash
curl -s -X POST http://localhost:8000/api/v1/ai/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"company_id\":1,\"user_id\":10,\"role\":\"ADMIN\",\"question\":\"What products should I buy this week?\",\"context\":{\"products\":[],\"stock\":[],\"sales\":[],\"movements\":[]}}"
```

(PowerShell users may prefer `curl.exe` as above or `Invoke-RestMethod`.)

Enrutamiento NLU (palabras clave ponderadas, sin LLM externo):

1. Compras / reposición → `purchase_suggestion`.  
2. Ventas / ingresos → `sales_summary`.  
3. Riesgo / mínimos / stock bajo → `stock_risk`.  
4. Movimientos / transferencias / kardex → `movement_analysis`.  
5. Búsqueda léxica de catálogo → `product_search`.  
6. Resto → `inventory_assistant`.

`confidence` refleja la confianza agregada del NLU (0–1). Las filas de `recommendations` pueden llevar `confidence` propio y `metadata`. `used_context` es `true` si alguna lista del contexto llega no vacía.

## Pruebas (`pytest`)

```bash
cd ai-service
py -m pip install -r requirements.txt
py -m pytest tests
```

## Ejemplo manual con contexto

`examples/chat-request.json` puede enviarse con `curl` al endpoint de chat cuando se omita Spring Boot durante depuraciones.

### Integración tras `api` Spring (JWT)

Desde login (`POST http://localhost:8080/api/v1/auth/login`):

```bash
curl -s -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What products should we restock next week?\"}"
```

## Next planned phases

1. **Spring Boot integration** — validate JWT / service identity; proxy sanitized tenant context from JPA repositories instead of trusting browser payloads alone.
2. **Company-specific context** — typed DTOs aligned with inventory aggregates produced by the Java domain layer.
3. **Purchase suggestions** — rule engine + optimization using stock minima, EOQ-style heuristics, or solver outputs.
4. **Forecasting** — time-series models per SKU × warehouse with evaluation pipelines.
5. **pgvector / RAG** — embeddings for products, docs, supplier PDFs scoped by `company_id` with retrieval-augmented generation.
6. **Anomaly detection** — spike/dip detection on movements and gross margin outliers.

## Project layout

```
ai-service/
├── app/
│   ├── main.py
│   ├── api/routes/
│   ├── core/config.py
│   ├── schemas/
│   └── services/
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── .env.example
├── examples/chat-request.json
├── tests/
└── README.md
```
