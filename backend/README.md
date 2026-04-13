# Backend — Spring Boot (PASO 5)

API REST del sistema de inventario: **JWT**, **JPA/Hibernate**, **PostgreSQL**, **Swagger (springdoc)**.

## Requisitos

- Java 17+
- Maven 3.9+ (o solo Docker para compilar/ejecutar)
- PostgreSQL con esquema aplicado (`../database/schema.sql`)

## Ejecutar en local

1. Levantar PostgreSQL (o `docker compose up -d db` desde la raíz del repo).
2. Variables opcionales: ver tabla más abajo (`JWT_SECRET`, `SPRING_DATASOURCE_*`, `APP_SEED_*`, etc.).
3. Desde esta carpeta:

```bash
mvn spring-boot:run
```

4. Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
5. Usuarios semilla por **email** (ver `DataInitializer` y tabla en README raíz): por defecto `admin@inventario.local` / `Admin123!`, más aux, compras y gerencia — configurable con `app.seed.*` / `APP_SEED_*`.

## Pruebas automatizadas

Arranque de contexto Spring con perfil `test` (H2 en memoria, sin Docker):

```bash
mvn verify
```

Los mismos tests se ejecutan en CI (GitHub Actions) al hacer push o abrir un PR.

## Variables de entorno (alineadas con `application.yml`)

| Variable | Propiedad Spring | Uso |
|----------|------------------|-----|
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | URL JDBC |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | Usuario BD |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | Contraseña BD |
| `JWT_SECRET` | `app.jwt.secret` | Secreto JWT (≥ 32 caracteres) |
| `JWT_EXPIRATION_MS` | `app.jwt.expiration-ms` | Caducidad del token |
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

## Roles (coinciden con `rol.codigo` en BD)

| Código       | Uso principal                          |
|-------------|-----------------------------------------|
| `ADMIN`     | Configuración, usuarios, maestros       |
| `AUX_BODEGA`| Movimientos, consultas                  |
| `COMPRAS`   | Entradas, consulta stock                |
| `GERENCIA`  | Solo lectura (inventario, reportes)     |

## Endpoints principales

| Área        | Prefijo |
|------------|---------|
| Auth       | `/api/v1/auth` |
| Usuarios   | `/api/v1/usuarios` |
| Categorías | `/api/v1/categorias` |
| Productos  | `/api/v1/productos` |
| Bodegas    | `/api/v1/bodegas` |
| Proveedores| `/api/v1/proveedores` |
| Inventario | `/api/v1/inventario` |
| Movimientos| `/api/v1/movimientos` (entradas, salidas, transferencias, ajustes) |
| Reportes   | `/api/v1/reportes` |

Contrato detallado: **`../docs/endpoints.md`**. Matriz de roles: **`../docs/roles-y-permisos.md`**.

## Salud

`GET /actuator/health` (público).

## Notas

- `ddl-auto: validate`: el esquema debe existir antes de arrancar (init SQL o Flyway futuro).
- Si la base se creó antes de la columna `motivo`, ejecutar `database/migrations/001_add_movimiento_motivo.sql`.
