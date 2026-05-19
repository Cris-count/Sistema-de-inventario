# Backend Spring Boot

API REST del sistema de inventario. Implementa autenticacion, autorizacion por roles, separacion multiempresa, inventario, movimientos, ventas POS, onboarding, planes y pagos con Stripe.

## Stack

- Java 17.
- Spring Boot 3.2.5.
- Spring Web, Spring WebFlux (WebClient para microservicio IA), Spring Security, Spring Data JPA, Bean Validation y Actuator.
- PostgreSQL en desarrollo mediante Docker.
- Hibernate con `ddl-auto: validate`.
- JWT HS256, refresh tokens, BCrypt, MFA/TOTP y rate limiting.
- Stripe Java SDK para Checkout y webhooks.
- springdoc-openapi para Swagger UI.

## Organizacion de Paquetes

| Paquete | Contenido |
|---------|-----------|
| `com.inventario.web.controller` | Controladores REST `/api/v1/*`. |
| `com.inventario.web.dto` | DTOs de entrada y salida (`web.dto.ai` para integracion IA). |
| `com.inventario.web.error` | Manejo centralizado de errores de negocio y validacion. |
| `com.inventario.domain.entity` | Entidades JPA. |
| `com.inventario.domain.repository` | Repositorios Spring Data. |
| `com.inventario.service` | Servicios de negocio transversales. |
| `com.inventario.service.catalog` | Catalogos, ventas y logica operativa asociada. |
| `com.inventario.service.saas` | Planes, suscripciones y checkout de plan. |
| `com.inventario.service.billing` | Integracion Stripe/billing. |
| `com.inventario.service.ai` | Asistente IA (`AIApplicationService`, `AIClient`, `AIContextBuilder`) y persistencia de recomendaciones (`service.ai.recommendation`). |
| `com.inventario.security` | Filtros JWT, validadores, detalles de usuario y seguridad HTTP. |
| `com.inventario.ratelimit` | Rate limiting en memoria o Redis. |

## Endpoints Principales

| Area | Prefijo |
|------|---------|
| Autenticacion | `/api/v1/auth` |
| Empresa / planes | `/api/v1/empresa`, `/api/v1/public/planes` |
| Onboarding | `/api/v1/onboarding` |
| Billing | `/api/v1/billing`, `/api/v1/billing/stripe/webhook` |
| Usuarios | `/api/v1/usuarios` |
| Productos | `/api/v1/productos` |
| Categorias | `/api/v1/categorias` |
| Bodegas | `/api/v1/bodegas` |
| Proveedores | `/api/v1/proveedores` |
| Clientes | `/api/v1/clientes` |
| Inventario | `/api/v1/inventario` |
| Movimientos | `/api/v1/movimientos` |
| Ventas / POS | `/api/v1/ventas` |
| Reportes | `/api/v1/reportes` |
| Mensajes de pedido | `/api/v1/mensajes-pedido` |
| Asistente IA (proxy) | `/api/v1/ai` |
| Recomendaciones IA persistidas | `/api/v1/ai/recommendations` |

Swagger UI esta disponible en `http://localhost:8080/swagger-ui.html` cuando la API esta levantada.

## Integracion servicio IA (FastAPI)

El cliente Angular **no** debe llamar directamente al microservicio Python (`localhost:8000`). Las peticiones pasan por Spring Boot para:

- Validar JWT, empresa activa y pertenencia del usuario al tenant.
- Restringir el asistente a roles (`ADMIN`, `SUPER_ADMIN`, `GERENCIA`, `COMPRAS`, `AUX_BODEGA`).
- Armar un JSON de contexto **multiempresa** (solo datos del `empresaId` del usuario autenticado), **acotado** y **sin entidades JPA**; construido por `AIContextBuilder`.
- Mantener la API Python fuera del navegador.

Los segmentos se limitan cada uno a **10** filas máximo. Si un segmento falla al cargarse, ese array queda vacío (se registra `WARN`), el resto se envía y la llamada a FastAPI sigue adelante. El log `INFO` tras armar contexto menciona sólo `empresaId`, rol y **conteos** (no contenido sensible).

Heurística por rol antes de poblar vectores (`@PreAuthorize` sigue como primera barrera): `ADMIN`, `SUPER_ADMIN`, `GERENCIA` y `COMPRAS` reciben productos, stock, ventas (30 días) y movimientos; `AUX_BODEGA` recibe productos, stock y movimientos (sin lista de ventas).

| Lista JSON | Resumen |
|------------|---------|
| `products` | Productos **activos**: `id`, `name`, `sku` (código interno), `category`, `active`, `createdAt`. |
| `stock` | Combinaciones producto×bodega con **menor** existencia: `productId`, `productName`, `currentStock`, `warehouseName`, `minimumStock`, `riskLevel` (`LOW` / `MEDIUM` / `HIGH`). |
| `sales` | Top ventas **CONFIRMADAS** últimos **30 días**: `productId`, `productName`, `quantitySold`, `period: "last_30_days"`. |
| `movements` | Hasta diez **líneas** de movimientos **COMPLETADOS** recientes: `movementId`, `type`, `productName`, `quantity`, `warehouseName`, `createdAt`. |

**Endpoint:** `POST /api/v1/ai/chat`

**Cuerpo (publico desde Angular):**

```json
{ "question": "What products should I buy this week?" }
```

**Variables de entorno / configuracion:**

| Propiedad | Variable entorno | Default |
|-----------|------------------|---------|
| `app.ai.service-url` | `AI_SERVICE_URL` | Fuera de Docker: `http://localhost:8000`. En Compose (servicio `api`): por defecto `http://ai-service:8000` (`docker-compose.yml`). |
| `app.ai.connect-timeout-ms` | `AI_SERVICE_CONNECT_TIMEOUT_MS` | `5000` |
| `app.ai.read-timeout-ms` | `AI_SERVICE_READ_TIMEOUT_MS` | `20000` |

Si el servicio Python no responde o hay error de red/HTTP, la API devuelve una respuesta controlada (`intent`: `ai_unavailable`) sin stack traces.

**Limitacion actual:** el motor en Python sigue siendo un placeholder deterministico (sin LLM externo).

### Ejemplo cURL

Tras obtener un access token con `POST /api/v1/auth/login`:

```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What products should I buy this week?\"}"
```

En Docker Compose la resolución DNS usa el **nombre del servicio**: `AI_SERVICE_URL=http://ai-service:8000` (valor por defecto ya inyectado en `api`). Fuera de contenedores, usar `http://localhost:8000`.

### Recomendaciones IA persistidas

Tras una respuesta **exitosa** de FastAPI (`answer` no vacío), `AIApplicationService` invoca `AiRecommendationPersistenceService.persistRecommendationsSafely(...)`: crea filas `PENDING` a partir de `recommendations[]` del JSON Python (**no** ejecuta órdenes de compra ni movimientos). Los errores de persistencia se registran con `WARN` y **no** alteran el cuerpo del chat (contrato estable).

- **Aislamiento tenant:** todas las consultas y mutaciones filtran por `empresa_id` del usuario autenticado (`Usuario.empresa.id`). No hay modo «fallback por userId» como tenant.
- **Dedupe:** misma huella SHA-256 (empresa + código + título + detalle + `product_id`/`productId` si existe en metadata) no se inserta de nuevo dentro de **24 horas**.
- **Contrato Python:** `AiPythonChatResponsePayload` / `AiPythonRecommendationPayload` ya aceptan alias `type` → `code` y `description` → `detail`; prioridad en campo `priority` o en `metadata.priority`.
- **Ciclo de estados:** `PENDING` → `ACCEPTED` (POST `.../accept`) → `EXECUTED` (POST `.../execute` tras el flujo operativo en la app); `PENDING` → `DISMISSED` (`.../dismiss`). No se permite volver a `PENDING` desde estados terminales (409 en transición inválida).
- **Endpoints:** `GET /api/v1/ai/recommendations?status=PENDING`, `POST .../{id}/accept|dismiss|execute` (mismos roles asistente que `/api/v1/ai/chat`) y `POST .../{id}/create-purchase-suggestion` para compras.
- **RESTOCK aceptada -> borrador de compra:** `POST /api/v1/ai/recommendations/{id}/create-purchase-suggestion` crea una fila `AiPurchaseSuggestion` en estado `DRAFT` solo si la recomendacion pertenece a la empresa actual, es `RESTOCK*` y esta `ACCEPTED`. Roles: `ADMIN`, `SUPER_ADMIN`, `COMPRAS`.
- **Sin automatizacion operativa:** la IA no crea compras finales, no aprueba pedidos, no envia movimientos y no cambia inventario. El borrador guarda una cantidad sugerida editable para revision humana.
- **Cantidad sugerida:** regla deterministica conservadora: si hay minimo y stock actual, `max(minimumStock * 2 - currentStock, 1)`; si hay ventas de ultimos 30 dias, se respeta al menos `ceil(quantitySoldLast30Days / 2)`; sin datos suficientes, `1`.
- **Duplicados:** solo se permite un borrador por recomendacion fuente; un segundo intento devuelve 409.
- **Revision de sugerencias de compra:** `GET /api/v1/ai/purchase-suggestions?status=DRAFT`, `GET /api/v1/ai/purchase-suggestions/{id}`, `PATCH /api/v1/ai/purchase-suggestions/{id}`, `POST .../{id}/approve`, `POST .../{id}/dismiss`.
- **Ciclo de sugerencia:** en esta fase solo `DRAFT -> APPROVED` y `DRAFT -> DISMISSED`. `PATCH` no cambia estado y solo edita `suggestedQuantity`, `notes` y `warehouseName` como texto de referencia. Aprobar no crea compra final ni movimiento de inventario.

**Migraciones:** el `pom.xml` **no** incluye Flyway ni Liquibase; en `application.yml` el perfil por defecto usa `spring.jpa.hibernate.ddl-auto: validate`. Para PostgreSQL hay que aplicar manualmente el script:

`src/main/resources/db/manual/create_ai_recommendations_postgresql.sql`

`src/main/resources/db/manual/create_ai_purchase_suggestions_postgresql.sql`

`src/main/resources/db/manual/alter_ai_purchase_suggestions_review_postgresql.sql` (solo si la tabla de sugerencias ya existia antes del flujo de revision)

Si las tablas no existen, el arranque fallara en `validate` al registrar `AiRecommendation` o `AiPurchaseSuggestion`.

## Seguridad y Multiempresa

El login se realiza con `POST /api/v1/auth/login`. Las llamadas autenticadas usan:

```http
Authorization: Bearer <accessToken>
```

El JWT incluye datos de usuario, pero el backend vuelve a cargar usuario, rol y empresa desde la base. Las operaciones con entidades multiempresa deben filtrar por `empresaId` y usar servicios de carga por tenant cuando corresponde.

Roles principales:

- `SUPER_ADMIN`
- `ADMIN`
- `AUX_BODEGA`
- `COMPRAS`
- `VENTAS`
- `GERENCIA`

La autorizacion se declara con `@PreAuthorize` en controladores y servicios. El frontend replica visibilidad para UX, pero no reemplaza esta capa.

## Base de Datos

La base por defecto se llama `inventario`, con usuario `inventario` y contrasena `inventario`. En Docker se publica en el host como `localhost:5433`.

`database/schema.sql` contiene el esquema completo para bases nuevas. `database/migrations/` contiene migraciones SQL idempotentes para bases existentes. No se usa Flyway/Liquibase.

El backend valida el esquema al iniciar:

```yaml
spring.jpa.hibernate.ddl-auto: validate
```

Si falta una tabla o columna, debe aplicarse `npm run db:sync` desde la raiz o recrear el volumen local si se trata de una base de desarrollo descartable.

## Ejecucion

Flujo Docker recomendado desde la raiz:

```bash
npm run up
```

Esto levanta `db`, `api` y `mailpit`, sincroniza migraciones y sirve el frontend.

Ejecucion manual del backend local:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

En macOS/Linux:

```bash
cd backend
./mvnw spring-boot:run
```

Nota actual: el script raiz `npm run backend` falla por un error de sintaxis en `scripts/run-backend.mjs`. Mientras no se corrija, usar Maven Wrapper directamente o el contenedor `api`.

## Variables Relevantes

| Variable | Descripcion |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | URL JDBC. Por defecto local `jdbc:postgresql://127.0.0.1:5433/inventario`. |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Credenciales PostgreSQL. |
| `JWT_SECRET` | Secreto requerido para JWT. |
| `JWT_EXPIRATION_MS` | Duracion del access token. |
| `REFRESH_TOKEN_*` | Configuracion de refresh tokens. |
| `STRIPE_SECRET_KEY` | Habilita Stripe Checkout. |
| `STRIPE_WEBHOOK_SECRET` | Valida webhooks de Stripe. |
| `APP_BILLING_FRONTEND_BASE_URL` | URL base del frontend para retornos Stripe. |
| `BILLING_API_SECRET` | Secreto para endpoints internos de billing. |
| `SPRING_MAIL_*` | Configuracion SMTP. En Docker dev se usa Mailpit. |
| `RATE_LIMIT_*` | Configuracion de rate limiting. |
| `APP_SEED_*` | Usuarios semilla. |

## Ventas y Pagos

`POST /api/v1/ventas` registra una venta confirmada de efectivo/directa. Crea el movimiento `SALIDA_POR_VENTA`, descuenta inventario y guarda la venta como `CONFIRMADA` dentro de una transaccion.

`POST /api/v1/ventas/stripe/preparar` crea una venta `PENDIENTE_PAGO` con `metodoPago = STRIPE` y `pagoEstado = STRIPE_PENDING`. No crea movimiento ni descuenta stock en ese momento. La confirmacion ocurre por webhook Stripe o por `POST /api/v1/ventas/{id}/stripe/sincronizar`, que consulta Stripe, valida metadata y monto, y finaliza la venta si la sesion esta pagada.

`POST /api/v1/ventas/{id}/cancelar-pendiente` cancela una venta Stripe pendiente sin movimiento de inventario. `POST /api/v1/ventas/{id}/anular` esta restringido a administracion y revierte stock de ventas confirmadas; no ejecuta reembolsos Stripe.

## Pruebas

Desde `backend/`:

```bash
.\mvnw.cmd verify
```

En macOS/Linux:

```bash
./mvnw verify
```

Las pruebas usan perfil de test y recursos propios bajo `backend/src/test/resources`.

## Consideraciones

- No modificar entidades multiempresa con repositorios directos sin validar `empresaId`.
- Mantener las migraciones SQL idempotentes, porque `db:sync` puede ejecutarse varias veces.
- No versionar claves `sk_`, `pk_`, secretos JWT ni credenciales SMTP reales.
- El comprobante de ventas es operativo, no documento tributario.
- La anulacion operativa de una venta Stripe no equivale a reembolso.
