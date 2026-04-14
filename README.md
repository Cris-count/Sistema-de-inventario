# Sistema de inventario

Monorepo con **frontend Angular** (carpeta `src/` en la **raíz**), **API Spring Boot** (`backend/`), **PostgreSQL** (`database/`) y **documentación** (`docs/`).

Si publicás el repo en GitHub, en la pestaña **Actions** verás el workflow **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

---

## Desarrollo local (unificado)

Flujo pensado para **PostgreSQL en Docker + Spring Boot local + Angular local** (no levanta el contenedor `api` del compose, así el puerto **8080** queda libre para `./mvnw`).

1. Una sola vez (o tras clonar): `npm install`
2. Arranque típico:

```bash
npm run up
```

Qué hace `npm run up`:

1. `docker compose up -d db` — **solo** el servicio `db`
2. Espera hasta **120 s** a que **127.0.0.1:5432** acepte conexiones TCP (evita que el backend falle al arrancar antes que Postgres)
3. **`npm run db:sync`** (mismo código que `node scripts/db-sync-dev.mjs`): comprueba el contenedor `db`, espera **`SELECT 1`** por TCP (`psql -h 127.0.0.1` dentro del contenedor), espera la tabla base **`rol`** (marca de que terminó el `schema.sql` del init en volúmenes nuevos) y aplica **`004`** y **`005`** con reintentos cortos ante fallos transitorios. Las migraciones son **idempotentes**. Los scripts de `/docker-entrypoint-initdb.d` **solo corren la primera vez** que el volumen está vacío.
4. En paralelo: `npm run backend` (Maven Wrapper en `backend/`) y `npm run frontend` (`ng serve`). **Ctrl+C** en esa terminal detiene backend y frontend; **no** apaga Docker.

Si el backend falla con `Schema-validation: missing table [...]` tras un `git pull`, ejecutá desde la raíz (con el contenedor `db` arriba): **`npm run db:sync`**, o volvé a correr **`npm run up`**.

Apagar contenedores del compose (Postgres y, si existía, API Docker):

```bash
npm run down
```

Eso ejecuta `docker compose down` **sin** `-v` (se conserva el volumen de datos). **No** mata procesos JVM o Node que hayas abierto en otras terminales.

**`docker compose down -v` (o `npm run down` no lo hace por defecto):** borra también los **volúmenes** nombrados del compose (p. ej. datos de Postgres). **Úsalo** cuando quieras **reinicializar la base desde cero** (vuelve a ejecutarse `database/schema.sql` en el próximo `up` del contenedor `db`). **Pérdida de datos.**

| Situación del volumen | Qué ocurre |
|------------------------|------------|
| **Volumen nuevo** (primera vez tras `down -v` o primera instalación) | El entrypoint de Postgres ejecuta `database/schema.sql`; `npm run db:sync` / paso 3 de `npm run up` espera la tabla `rol` y luego aplica 004/005 (idempotentes). |
| **Volumen existente** con esquema antiguo | `schema.sql` **no** se vuelve a ejecutar; 004/005 añaden lo que falte (`billing_event`, etc.). |
| **Volumen existente** ya alineado | 004/005 siguen siendo seguros (IF NOT EXISTS / idempotente). |

| Flujo | Cuándo usarlo |
|--------|----------------|
| **`npm run up`** | Desarrollo diario: DB en Docker, API y front en tu máquina. |
| **`npm run db`** + terminales separadas | Mismo resultado que `up`, pero sin `concurrently` (más control manual). |
| **`docker compose up -d --build`** o **`npm run db:up`** | **Stack Docker**: Postgres **y** API en contenedor. **No** ejecutes a la vez `npm run backend` (choque en **8080**). |

---

## Cómo ejecutar el proyecto

Orden recomendado para desarrollo local (paso a paso manual): **base de datos → backend → frontend**.

### 1. Levantar base de datos

**Flujo recomendado (Postgres en Docker + API en tu máquina con `npm run backend`):** levantá **solo** el servicio `db` para no ocupar el puerto `8080` con el contenedor `api`.

```bash
docker compose up -d db
```

**Alternativa — todo en Docker** (Postgres + API en contenedores; **no** ejecutes además `npm run backend` en el mismo puerto):

```bash
docker compose up -d --build
```

Si solo querés “levantar compose” sin elegir servicio, `docker compose up -d` arranca **db y api** a la vez (equivalente a la alternativa anterior).

- **Host:** `localhost` · **Puerto:** `5432` · **Base:** `inventario` · **Usuario / contraseña:** `inventario` / `inventario` (alineado con `backend/src/main/resources/application.yml` y `docker-compose.yml`).
- La primera vez que el volumen de Postgres está vacío, se ejecuta `database/schema.sql` como script de inicialización (esquema completo). **No se usa Flyway** en este proyecto; las carpetas `database/migrations/*.sql` sirven para actualizar bases **ya existentes** manualmente.

### 2. Levantar backend

Desde la raíz del repositorio:

```bash
npm run backend
```

O desde la carpeta `backend/`:

```bash
cd backend
./mvnw spring-boot:run
```

En Windows: `.\mvnw.cmd spring-boot:run` (misma carpeta `backend/`).

Requisitos: **JDK 17+** (el wrapper descarga Maven si hace falta). No necesitás Maven instalado globalmente.

### 3. Levantar frontend

En otra terminal, desde la raíz:

```bash
npm install
npm start
```

(`npm start` y `npm run dev` ejecutan el mismo comando: servidor de desarrollo de Angular.)

### 4. URLs

| Qué | URL |
|-----|-----|
| **Frontend** | http://localhost:4200 |
| **Backend** | http://localhost:8080 |
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| **Health** | http://localhost:8080/actuator/health |
| **Planes públicos (sin JWT)** | `GET` http://localhost:8080/api/v1/public/planes |

La URL del API consumida por Angular está en `src/environments/environment.ts` (`apiUrl`: por defecto `http://localhost:8080/api/v1`).

### 5. Notas y problemas comunes

| Tema | Detalle |
|------|---------|
| **Maven Wrapper** | Scripts en `backend/mvnw` y `backend/mvnw.cmd`. CI y `npm run backend` los usan. |
| **Postgres / conexión** | Si el backend muestra *Connection refused*, asegurate de que el contenedor `db` esté arriba (`docker compose ps`) y que el puerto 5432 no lo use otra instancia. |
| **Esquema / Hibernate** | Con `ddl-auto: validate`, la base debe coincidir con las entidades. En Docker nuevo, `schema.sql` inicializa todo; en BD antigua, revisá `database/migrations/`. |
| **Lombok (IntelliJ)** | Si falla el build con `TypeTag :: UNKNOWN`, actualizá el plugin Lombok, activá *Annotation Processing* y reimportá Maven. El `pom.xml` fija una versión reciente de Lombok. |
| **Puertos** | Backend `8080`, Angular `4200`, Postgres `5432`. Cambiá `SERVER_PORT` o la config de `ng serve` si chocan. |

### Scripts npm (raíz)

| Script | Descripción |
|--------|-------------|
| `npm start` / `npm run dev` / `npm run frontend` | Angular (`ng serve`, configuración `development`). |
| `npm run backend` | Spring Boot (`mvnw spring-boot:run` desde `backend/`). |
| `npm run db` | Solo PostgreSQL: `docker compose up -d db` (recomendado antes de `npm run backend`). |
| `npm run db:sync` | Aplica migraciones **004 + 005** en el contenedor `db` (idempotente; útil si el volumen es antiguo). |
| `npm run up` | **Dev local unificado:** `db` + espera 5432 + **db:sync** + `backend` y `frontend` en paralelo (`concurrently`). |
| `npm run down` | `docker compose down` (contenedores del proyecto; conserva volúmenes). |
| `npm run db:up` | `docker compose up -d` (sube **db + api**; ver nota de puertos arriba). |
| `npm run db:up:build` | Igual con `--build`. |
| `npm run build` | Build de producción del frontend. |
| `npm run ci` | Build + tests unitarios Angular (usado en CI del front). |

---

## Arquitectura

**Decisión:** el backend se mantiene como **monolito modular** (un único despliegue Spring Boot, paquetes por dominio). Una eventual separación en microservicios queda como evolución futura.

## Estructura del repositorio

| Ruta | Contenido |
|------|-----------|
| `src/` | Aplicación Angular (no hay subcarpeta `angular/` ni `frontend/` con el código; `frontend/README.md` es documentación). |
| `angular.json`, `package.json` | Proyecto Angular en la raíz. |
| `backend/` | Spring Boot — [backend/README.md](backend/README.md) |
| `database/` | `schema.sql`, migraciones SQL manuales, scripts de desarrollo |
| `scripts/` | `run-backend.mjs`, `dev-up.mjs`, `dev-down.mjs`, `db-sync-dev.mjs` |
| `docs/` | [docs/INDICE.md](docs/INDICE.md) |
| `tests/postman/` | Colección Postman ([tests/README.md](tests/README.md)) |
| `docker-compose.yml` | Postgres (+ servicio `api` opcional) |

## Requisitos rápidos

- **Node.js20+** (recomendado; CI usa 20), **Docker Desktop** para Postgres.
- **JDK 17+** para el backend local.

## Levantar API + base con Docker (todo el stack)

```bash
docker compose up -d --build
```

| Servicio | URL / acceso |
|----------|----------------|
| API REST | http://localhost:8080 |
| PostgreSQL | `localhost:5432`, base `inventario`, usuario `inventario`, contraseña `inventario` |

**Usuarios semilla** (se crean por email si no existen; valores por defecto en `application.yml` / Docker):

| Rol | Email | Contraseña por defecto |
|-----|--------|-------------------------|
| ADMIN | `admin@inventario.local` | `Admin123!` |
| AUX_BODEGA | `aux@inventario.local` | `AuxBodega123!` |
| COMPRAS | `compras@inventario.local` | `Compras123!` |
| GERENCIA | `gerencia@inventario.local` | `Gerencia123!` |

**Flujo:** login → JWT → operaciones según rol; el rol efectivo lo confirma el servidor (`GET /auth/me`).

## Frontend (detalle)

- Ruta **`/`** → landing pública. **`/app`** → panel (requiere JWT). **`/login`** → inicio de sesión.
- Compilación de producción: `npm run build` (usa `environment.prod.ts`).

## Integración continua

El workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) ejecuta:

- **Frontend:** `npm ci` y `npm run ci`
- **Backend:** `backend/mvnw` (`./mvnw -B verify`)

[Dependabot](.github/dependabot.yml) propone actualizaciones mensuales de npm, Maven y GitHub Actions.

## Variables opcionales (Docker)

Podés copiar [.env.example](.env.example) a `.env` en la raíz para definir `JWT_SECRET`, `APP_SEED_*`, etc. (el archivo `.env` no se versiona).

## Variables de entorno (backend)

Spring Boot lee propiedades desde `backend/src/main/resources/application.yml`. Equivalentes frecuentes:

| Variable de entorno | Propiedad | Descripción |
|---------------------|-----------|-------------|
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | JDBC PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | Usuario BD |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | Contraseña BD |
| `JWT_SECRET` | `app.jwt.secret` | Secreto HMAC (mín. 32 caracteres para HS256) |
| `BILLING_API_SECRET` | `app.billing.api-secret` | Secreto para webhooks / confirmación de pago |
| `SERVER_PORT` | `server.port` | Puerto del API (default `8080`) |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/INDICE.md](docs/INDICE.md) | Índice general |
| [docs/endpoints.md](docs/endpoints.md) | Contrato API |
| [docs/roles-y-permisos.md](docs/roles-y-permisos.md) | Matriz de permisos |
| [backend/README.md](backend/README.md) | Detalle del API |
| [frontend/README.md](frontend/README.md) | Detalle del cliente Angular |
| [README_BACKEND.md](README_BACKEND.md) | Notas de arquitectura backend (legado / referencia) |

## Tests backend

Desde `backend/`:

```bash
./mvnw verify
```

Incluye `InventarioApplicationTests` y `BillingPaymentConfirmationIT` (perfil `test`, H2).

## Más ayuda

- Solo base de datos: `docker compose up -d db`
- Newman / Postman: `npm run test:api` (requiere API en marcha)
