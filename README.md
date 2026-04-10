# Sistema de inventario

Monorepo con **frontend Angular** (raíz), **API Spring Boot** (`backend/`), **PostgreSQL** (`database/`) y **documentación** (`docs/`).

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

**Usuario administrador semilla** (solo si la tabla `usuario` está vacía al arrancar):

- Email: `admin@inventario.local`
- Contraseña: `Admin123!`

Se puede cambiar con variables de entorno (ver abajo).

## Frontend (Angular)

```bash
npm install
npm start
```

Abre http://localhost:4200 — debe estar levantado el API (p. ej. `docker compose up`) y configurada la URL en `src/environments/environment.ts` (por defecto `http://localhost:8080/api/v1`). Detalle del frontend: [frontend/README.md](frontend/README.md).

Compilación de producción:

```bash
npm run build
```

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
| `tests/postman/` | Colección Postman de ejemplo |
| `docker-compose.yml` | Postgres + API |

## Documentación académica

Índice: [docs/INDICE.md](docs/INDICE.md) (pasos 1–4, contrato de API, etc.).

## Más ayuda

- Detalle de endpoints: [docs/endpoints.md](docs/endpoints.md)
- Solo base de datos: `docker compose up -d db`
- Backend sin Docker: [backend/README.md](backend/README.md)
