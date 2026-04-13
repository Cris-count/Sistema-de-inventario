# Backend — Inventario API (Spring Boot)

Monolito modular en un único JAR: **Spring Boot 3.2**, **Java 17**, **PostgreSQL**, **JWT (HS256)**, **Spring Security** (`@PreAuthorize`), **springdoc-openapi** (Swagger).

Documentación de contrato HTTP: **[docs/endpoints.md](docs/endpoints.md)** y Swagger en runtime: `http://localhost:8080/swagger-ui.html`.

---

## Estructura de paquetes (`com.inventario`)

| Paquete | Contenido |
|---------|-----------|
| `bootstrap` | `DataInitializer` — usuarios semilla por email (BCrypt). |
| `config` | OpenAPI, constantes de roles (`SecurityRoles`). |
| `domain.entity` | Entidades JPA. |
| `domain.repository` | Spring Data JPA. |
| `service` | Lógica de negocio (`AuthService`, `MovimientoService`, `CurrentUserService`, …). |
| `security` | `SecurityConfig`, `JwtService`, `JwtAuthenticationFilter`, `DomainUserDetailsService`, CORS. |
| `web.controller` | REST `/api/v1/*`. |
| `web.dto` | DTOs de API (login, movimientos, token). |
| `web.error` | `GlobalExceptionHandler`, `BusinessException`, mensajes Problem Details. |

---

## Seguridad

1. **Login:** `POST /api/v1/auth/login` → `AuthenticationManager` + `UserDetailsService` (BCrypt).
2. **JWT:** firma con `app.jwt.secret` (≥ 32 caracteres). Claims: `sub` (email), `uid`, `rol` (informativo).
3. **Requests autenticadas:** `JwtAuthenticationFilter` valida el token y **vuelve a cargar el rol desde la BD** (no solo el claim), alineado con `GET /auth/me`.
4. **Autorización:** `@PreAuthorize` por método (ver `docs/roles-y-permisos.md`).
5. **CORS:** orígenes `http://localhost:4200` y `http://127.0.0.1:4200`.

---

## Configuración

- Principal: `backend/src/main/resources/application.yml`.
- Perfil test: `backend/src/test/resources/application-test.yml` (H2).
- Variables de entorno: tabla en [README.md](README.md) (raíz).

---

## Cómo ejecutar

```bash
cd backend
mvn spring-boot:run
```

O con Docker desde la raíz del monorepo: `docker compose up -d --build`.

---

## Pruebas

```bash
cd backend
mvn verify
```

---

## Más detalle

Ver también [backend/README.md](backend/README.md) (resumen operativo del mismo módulo).
