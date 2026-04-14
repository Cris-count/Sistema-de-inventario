# Backend — Spring Boot (PASO 5)

API REST del sistema de inventario: **JWT**, **JPA/Hibernate**, **PostgreSQL**, **Swagger (springdoc)**.

## Requisitos

- Java 17+
- **Maven no es obligatorio:** usar el wrapper (`./mvnw` o `mvnw.cmd` en Windows).
- PostgreSQL con esquema aplicado (`../database/schema.sql` o init Docker)

## Ejecutar en local

1. Levantar PostgreSQL (`docker compose up -d db` desde la raíz del repo).
2. Variables opcionales: ver tabla más abajo (`JWT_SECRET`, `SPRING_DATASOURCE_*`, `APP_SEED_*`, etc.).
3. Desde la **raíz del monorepo**: `npm run backend` **o** desde esta carpeta:

```bash
./mvnw spring-boot:run
```

4. Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
5. Usuarios semilla por **email** (ver `DataInitializer` y tabla en README raíz): por defecto `admin@inventario.local` / `Admin123!`, más aux, compras y gerencia — configurable con `app.seed.*` / `APP_SEED_*`.

## Pruebas automatizadas

Arranque de contexto Spring con perfil `test` (H2 en memoria, sin Docker):

```bash
./mvnw verify
```

Los mismos tests se ejecutan en CI (GitHub Actions) con el wrapper al hacer push o abrir un PR.

## Variables de entorno (alineadas con `application.yml`)

| Variable | Propiedad Spring | Uso |
|----------|------------------|-----|
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | URL JDBC |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | Usuario BD |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | Contraseña BD |
| `JWT_SECRET` | `app.jwt.secret` | Secreto JWT (≥ 32 caracteres) |
| `JWT_EXPIRATION_MS` | `app.jwt.expiration-ms` | Caducidad del token |
| `BILLING_API_SECRET` | `app.billing.api-secret` | Secreto webhook / confirmación manual de pago |
| `BILLING_POST_PAYMENT_EMPRESA` | `app.billing.post-payment-empresa-estado` | `ACTIVA` o `EN_PRUEBA` tras pago |
| `SERVER_PORT` | `server.port` | Puerto (default 8080) |
| `APP_SEED_ADMIN_EMAIL` | `app.seed.admin-email` | Email del primer ADMIN |
| `APP_SEED_ADMIN_PASSWORD` | `app.seed.admin-password` | Contraseña en texto plano (se hashea al crear) |

## Docker (API + DB)

Desde la **raíz del repositorio**:

```bash
docker compose up -d --build
```

- API: `http://localhost:8080`  
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Autenticación

`POST /api/v1/auth/login` con JSON `{ "email", "password" }` → respuesta incluye `accessToken`.

Cabecera en el resto de llamadas:

```http
Authorization: Bearer <accessToken>
```

## Multi-empresa (multi-tenant)

- Cada usuario tiene una **empresa**; listados y operaciones filtran por `empresaId`.
- **Regla crítica**: no usar `findById` en entidades con `empresa_id` desde la aplicación; usar `TenantEntityLoader` y servicios en `com.inventario.service.catalog` (los controladores no inyectan esos repositorios).
- Migraciones: `../database/migrations/002_multiempresa.sql`, `../database/migrations/003_empresa_updated_by.sql` (trazabilidad `updated_by` en empresa).
- Contrato ampliado: login y `GET /api/v1/auth/me` incluyen `empresaId` y `empresaNombre`; el JWT puede incluir el claim `empresaId` (si no coincide con la BD → 401).
- Endpoints: `GET /api/v1/empresa/mi`, `PUT /api/v1/empresa/mi` (solo `ADMIN` o `SUPER_ADMIN`; validación de email/teléfono).
- Detalle: **`../docs/multiempresa-backend.md`**.

## Roles (coinciden con `rol.codigo` en BD)

| Código         | Uso principal |
|----------------|----------------------------------------------------|
| `SUPER_ADMIN`  | Igual que `ADMIN` en la API; solo él asigna `SUPER_ADMIN` a otros |
| `ADMIN`        | Configuración, usuarios, maestros                  |
| `AUX_BODEGA`   | Movimientos, consultas                             |
| `COMPRAS`      | Entradas, consulta stock                         |
| `GERENCIA`     | Solo lectura (inventario, reportes) |

## Endpoints principales

| Área        | Prefijo |
|------------|---------|
| Auth       | `/api/v1/auth` |
| Empresa    | `/api/v1/empresa` (`/mi`) |
| Usuarios   | `/api/v1/usuarios` |
| Categorías | `/api/v1/categorias` |
| Productos  | `/api/v1/productos` |
| Bodegas    | `/api/v1/bodegas` |
| Proveedores| `/api/v1/proveedores` |
| Inventario | `/api/v1/inventario` |
| Movimientos| `/api/v1/movimientos` (entradas, salidas, transferencias, ajustes) |
| Reportes   | `/api/v1/reportes` |
| Público / onboarding | `/api/v1/public/planes`, `/api/v1/onboarding/register-company` |
| Facturación (secreto `X-Billing-Secret`) | `/api/v1/billing/webhook`, `/api/v1/billing/pagos/{id}/confirmar-onboarding` |

Contrato detallado: **`../docs/endpoints.md`**. Matriz de roles: **`../docs/roles-y-permisos.md`**. Onboarding y pago: **`../docs/billing-onboarding-payment.md`**.

## Salud

`GET /actuator/health` (público).

## Notas

- `ddl-auto: validate`: el esquema debe existir antes de arrancar. **No hay Flyway:** se usa `database/schema.sql` (Docker/init) y `database/migrations/*.sql` a mano en bases ya existentes.
- Si la base se creó antes de la columna `motivo`, ejecutar `database/migrations/001_add_movimiento_motivo.sql`.
- Multi-empresa: aplicar `database/migrations/002_multiempresa.sql` y `003_empresa_updated_by.sql` (o usar `../database/schema.sql` en bases nuevas).
- SaaS onboarding / planes: `004_onboarding_saas.sql`; compra y pago: `005_billing_compra_pago.sql`.
