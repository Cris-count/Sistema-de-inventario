# Sistema de inventario

Monorepo con **frontend Angular** (raíz), **API Spring Boot** (`backend/`), **PostgreSQL** (`database/`) y **documentación** (`docs/`).

Si publicás el repo en GitHub, en la pestaña **Actions** verás el workflow **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Podés añadir un badge con la URL `https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg`.

## Arquitectura

**Decisión:** el backend se mantiene como **monolito modular** (un único despliegue Spring Boot, paquetes por dominio: entidades, repositorios, servicios, controladores). Prioriza transacciones locales en inventario/movimientos, simplicidad operativa y coherencia con el modelo actual. Una eventual separación en microservicios queda como **evolución futura** si el contexto del negocio o del equipo lo justifica.

## Requisitos rápidos

- **Node.js** (para Angular) y **Docker Desktop** (recomendado para DB + API).
- Opcional: **Java 17** + **Maven** si compilás el backend sin Docker.

## Levantar todo (API + base de datos)

En la raíz del repositorio:

```bash
docker compose up -d --build
```

| Servicio | URL / acceso |
|----------|----------------|
| API REST | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| PostgreSQL | `localhost:5432`, base `inventario`, usuario `inventario`, contraseña `inventario` |

**Usuarios semilla** (se crean por **email** si aún no existen; contraseñas en BCrypt; valores por defecto en `application.yml` / Docker):

| Rol | Email | Contraseña por defecto |
|-----|--------|-------------------------|
| ADMIN | `admin@inventario.local` | `Admin123!` |
| AUX_BODEGA | `aux@inventario.local` | `AuxBodega123!` |
| COMPRAS | `compras@inventario.local` | `Compras123!` |
| GERENCIA | `gerencia@inventario.local` | `Gerencia123!` |

Sobrescribir con `APP_SEED_*` (ver abajo). No dejar variables vacías en `.env` si usás Docker Compose.

**Flujo:** login → JWT → operaciones según rol; el rol efectivo lo confirma el servidor (`GET /auth/me`).

## Frontend (Angular)

```bash
npm install
npm start
```

Abre http://localhost:4200 — debe estar levantado el API (p. ej. `docker compose up`) y configurada la URL en `src/environments/environment.ts` (por defecto `http://localhost:8080/api/v1`).

Compilación de producción (`ng build` usa `environment.prod.ts` con `production: true`; ajustá `apiUrl` ahí para tu despliegue):

```bash
npm run build
```

Verificación local (mismo comando que en CI: build + tests):

```bash
npm run ci
```

## Integración continua

El workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) ejecuta en cada push y pull request a `main` o `master`:

- **Frontend:** `npm ci` y `npm run ci`
- **Backend:** `mvn -B -f backend/pom.xml verify`

[Dependabot](.github/dependabot.yml) propone actualizaciones mensuales de npm, Maven y GitHub Actions.

## Variables opcionales (Docker)

Podés copiar [.env.example](.env.example) a `.env` en la raíz para definir `JWT_SECRET`, `APP_SEED_ADMIN_EMAIL` y `APP_SEED_ADMIN_PASSWORD` al usar `docker compose` (el archivo `.env` no se versiona).

## Variables de entorno (backend)

Spring Boot lee propiedades desde `backend/src/main/resources/application.yml`. Las equivalentes por entorno (estilo `APP_*`) son:

| Variable de entorno | Propiedad | Descripción |
|---------------------|-----------|-------------|
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | JDBC PostgreSQL (por defecto `localhost:5432/inventario`) |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | Usuario BD |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | Contraseña BD |
| `JWT_SECRET` | `app.jwt.secret` | Secreto HMAC (mín. 32 caracteres para HS256) |
| `JWT_EXPIRATION_MS` | `app.jwt.expiration-ms` | Duración del token en ms |
| `SERVER_PORT` | `server.port` | Puerto del API (default `8080`) |
| `APP_SEED_ADMIN_EMAIL` | `app.seed.admin-email` | Email del primer usuario ADMIN si no hay usuarios |
| `APP_SEED_ADMIN_PASSWORD` | `app.seed.admin-password` | Contraseña de ese usuario (se guarda con BCrypt) |

En **Docker Compose** (`docker-compose.yml`) ya se pasan `JWT_SECRET`, `APP_SEED_ADMIN_EMAIL` y `APP_SEED_ADMIN_PASSWORD` al servicio `api`.

## Estructura del repositorio

| Carpeta / archivo | Contenido |
|-------------------|-----------|
| `src/` | Aplicación Angular |
| `backend/` | Spring Boot — ver [backend/README.md](backend/README.md) |
| `database/` | `schema.sql`, migraciones y scripts de desarrollo |
| `docs/` | Proceso, requisitos, modelo, endpoints — [docs/INDICE.md](docs/INDICE.md) |
| `tests/postman/` | Colección Postman ([tests/README.md](tests/README.md)) |
| `docker-compose.yml` | Postgres + API |

## Documentación

| Documento | Contenido |
|-----------|------------|
| [docs/INDICE.md](docs/INDICE.md) | Índice general |
| [docs/endpoints.md](docs/endpoints.md) | **Contrato API real** (métodos, roles, ejemplos) |
| [docs/roles-y-permisos.md](docs/roles-y-permisos.md) | Matriz de permisos |
| [docs/pruebas-api.md](docs/pruebas-api.md) | Cómo probar y evidencia de humo |
| [README_BACKEND.md](README_BACKEND.md) | Arquitectura del backend |

## Más ayuda

- Solo base de datos: `docker compose up -d db`
- Backend: [backend/README.md](backend/README.md)
