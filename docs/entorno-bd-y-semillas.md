# Guía operativa: BD, roles, usuarios semilla e identidad (estado actual del repo)

Ámbito: Spring Boot + PostgreSQL + Docker + JWT + `DataInitializer` + `database/dev_verify_and_seed.sql`.

---

## 1. Diagnóstico de la estrategia actual (semillas)

**`DataInitializer`** (`backend/.../bootstrap/DataInitializer.java`):

| Comportamiento | Evaluación |
|----------------|------------|
| No usa `count() == 0` | Correcto: evita que un único usuario impida sembrar el resto. |
| `existsByEmail(email)` antes de crear | Correcto: idempotente por email. |
| `passwordEncoder.encode(...)` | BCrypt real vía `PasswordEncoder` bean (`SecurityConfig`). |
| Email vacío (tras trim) | No intenta crear ese perfil. |
| Contraseña vacía | WARN en log y no crea (evita usuarios inconsistentes). |
| Rol inexistente | `IllegalStateException` al arranque: obliga a tener filas en `rol`. |
| Orden | ADMIN → AUX_BODEGA → COMPRAS → GERENCIA (cada uno independiente). |

**Riesgo aceptable:** si borras un usuario en BD y reinicias, se vuelve a crear si el email sigue en `application.yml` / env.

---

## 2. Qué ya está bien (confirmación)

- Columna **`password_hash`**, **`nombre` NOT NULL**: alineado con `database/schema.sql` y entidad `Usuario`.
- **`dev_verify_and_seed.sql`**: inspecciona esquema y roles; **no** inserta usuarios con texto plano.
- **`application.yml`**: `app.seed.*` para cuatro cuentas (defaults solo desarrollo).
- **`application-test.yml`**: emails extra vacíos para que en H2 solo se sembre admin (coherente con `test-seed.sql` que solo inserta rol ADMIN).
- **Identidad canónica:** `GET /api/v1/auth/me` lee usuario desde BD vía `SecurityContext` + `UsuarioRepository`.

---

## 3. Procedimiento: revisar la base de datos

### 3.1 Prerrequisitos

- PostgreSQL accesible (local o contenedor `inventario-postgres`).
- Credenciales: por defecto en Docker `inventario` / `inventario`, BD `inventario`.

### 3.2 Ejecutar el script de verificación

Desde la raíz del repo (ajusta host si es remoto):

```bash
psql -h localhost -p 5432 -U inventario -d inventario -f database/dev_verify_and_seed.sql
```

En Windows (PowerShell), si `psql` está en PATH:

```powershell
psql -h localhost -p 5432 -U inventario -d inventario -f database/dev_verify_and_seed.sql
```

### 3.3 Interpretar cada bloque

| Sección | Qué mirar |
|---------|-----------|
| **1** | Deben aparecer tablas `rol`, `usuario`, y el resto del dominio (`producto`, `categoria`, …). Si faltan, aplicar `database/schema.sql` sobre una BD coherente o recrear volumen Docker. |
| **2** | Columnas de `usuario`: debe existir `password_hash`, `nombre`, `rol_id`, … Si ves `password`, el esquema **no** es el del proyecto. |
| **3** | Columnas de `rol`: `codigo` UNIQUE. |
| **4** | Cuatro filas esperadas: `ADMIN`, `AUX_BODEGA`, `COMPRAS`, `GERENCIA`. |
| **5** | Upsert de roles: idempotente; alinea textos si ya existían. |
| **6** | Lista usuarios con `rol_codigo`: debe coincidir con lo que esperas tras arrancar el API. |
| **7** | Admin por defecto: solo relevante si usas email por defecto. |
| **8** | Comentarios: recordatorio de no INSERT manual sin BCrypt. |
| **9** | Conteos: al menos `rol` ≥ 4; `usuario` ≥ 0 hasta que arranque el backend. |

---

## 4. Procedimiento: validar usuarios semilla

1. Asegurar que la sección **5** del SQL dejó los cuatro roles (o que `schema.sql` ya los insertó).
2. Arrancar el backend (IDE, `mvn spring-boot:run`, o `docker compose up` con servicio `api`).
3. **Logs** (nivel INFO):
   - `Usuario semilla creado: <email> (<ROL>)` → primera vez.
   - Si no aparece para uno: o ya existía (`DEBUG` “Usuario ya existe”), o email/contraseña vacíos (`WARN`), o fallo previo (excepción).
4. **SQL:** repetir sección **6** de `dev_verify_and_seed.sql`:
   - Deberías ver hasta cuatro filas (emails de `application.yml` o variables `APP_SEED_*`).
5. **Rol por fila:** `rol_codigo` debe ser el esperado (ADMIN, AUX_BODEGA, COMPRAS, GERENCIA).

**Falta un rol:** ejecutar sección 5 del script o revisar `schema.sql`.

**Falta un usuario:** comprobar env (¿email vacío deshabilita ese seed?), contraseña no vacía, y que no haya fallado el arranque antes del `CommandLineRunner`.

---

## 5. Procedimiento: login y verificación de identidad

### 5.1 Login

- `POST /api/v1/auth/login` con `{ "email", "password" }`.
- Respuesta incluye `accessToken` y `user` (resumen).

### 5.2 BCrypt funcionando

- Si el usuario existe y la contraseña es la configurada, el login **debe** devolver 200.
- Si metes la contraseña correcta pero el hash en BD no es BCrypt válido o está corrupto → **401** (`BadCredentialsException`).
- No hay atajo: el hash tiene que haberlo generado Spring (`DataInitializer` o creación vía API con el mismo encoder).

### 5.3 Identidad: `GET /api/v1/auth/me`

- Header: `Authorization: Bearer <accessToken>`.
- Cuerpo: `email`, `rolCodigo`, `rolNombre`, etc. (**desde BD**, no solo del token).

### 5.4 Frontend

- `localStorage`: `inventario_user`, `inventario_token`.
- Tras `syncUserGuard`, el usuario en memoria debe alinearse con `/auth/me`.

### 5.5 Token vs BD

- El JWT puede llevar claim `rol`; **la autorización en endpoints** usa el rol cargado desde **PostgreSQL** en `JwtAuthenticationFilter` (email del subject → usuario → `rol.codigo`).
- Si cambias `rol_id` en BD, hace falta **nuevo login** (nuevo JWT) y/o refresco de perfil para que la UI no muestre datos viejos.

---

## 6. Qué hacer si algo falla

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Arranque falla: “Rol X no existe” | No hay filas en `rol` | Ejecutar `schema.sql` o sección 5 de `dev_verify_and_seed.sql`. |
| No aparece log “Usuario semilla creado” | Email vacío; password vacía; usuario ya existe | Revisar `application.yml` / `.env` / env del contenedor; sección 6 SQL. |
| Login 401 con usuario “recién creado” | Contraseña distinta a la del env; usuario creado a mano sin BCrypt | Recrear vía `DataInitializer` o API; no insertar SQL plano. |
| `/auth/me` distinto de BD | Token de otro usuario; caché UI | Logout, borrar `inventario_*` en storage, login de nuevo. |
| Frontend muestra otro rol | `localStorage` viejo | Mismo; comprobar `runGuardsAndResolvers` en rutas `/app`. |
| Docker “variables viejas” | Imagen/contenedor sin rebuild; `.env` no cargado | `docker compose config` para ver valores resueltos; recrear contenedor `api`. |
| 403 en operaciones | Rol real no autorizado (p. ej. COMPRAS y escritura de producto) | Ver `rol_codigo` en `/auth/me` y reglas `@PreAuthorize`. |

---

## 7. Checklist final

- [ ] `psql` + `dev_verify_and_seed.sql` sin errores de relación.
- [ ] `SELECT * FROM rol` → 4 códigos.
- [ ] API arrancada → logs de semilla o “ya existe”.
- [ ] `SELECT u.email, r.codigo FROM usuario u JOIN rol r ON r.id = u.rol_id` → filas esperadas.
- [ ] Login por cada cuenta de prueba → 200.
- [ ] `GET /api/v1/auth/me` con Bearer → coincide con BD.
- [ ] Productos: ADMIN y AUX_BODEGA pueden escribir; COMPRAS no (diseño actual).

---

## 8. Recomendaciones: desarrollo y producción

| Tema | Desarrollo | Producción |
|------|------------|------------|
| Contraseñas por defecto | Aceptables en máquina local | **Prohibido** usar defaults; definir `APP_SEED_*` o no sembrar y usar provisionamiento seguro. |
| `JWT_SECRET` | Default del repo | Valor largo y único por entorno; mismo valor en todo el despliegue del API. |
| Semillas | Útil para QA local | Desactivar emails de seed o usar solo creación administrada (IAM, scripts firmados). |
| Datos manuales en SQL | Solo roles sin usuarios, o hashes generados por Spring | Auditoría de quién crea usuarios. |
| `ddl-auto: validate` | Ya configurado | No desactivar validate en prod sin migraciones controladas. |

---

## 9. Tabla resumen operativa

| Objetivo | Archivo / endpoint | Qué ejecutar o revisar | Resultado esperado | Cómo verificarlo | Prioridad |
|----------|-------------------|-------------------------|--------------------|------------------|-----------|
| Tablas existen | `dev_verify_and_seed.sql` §1 | Ejecutar script | Lista con `usuario`, `rol` | Salida `psql` | Alta |
| Columnas correctas | §2–3 | Mismas secciones | `password_hash`, `nombre` en `usuario` | Comparar con `schema.sql` | Alta |
| Roles base | §4–5 | SELECT / INSERT upsert | 4 roles | `SELECT * FROM rol` | Alta |
| Usuarios BCrypt | `DataInitializer.java` | Arranque API | Logs creación o skip | Logs + §6 SQL | Alta |
| Login | `POST /api/v1/auth/login` | Body JSON credenciales | 200 + token | Respuesta HTTP | Alta |
| Identidad | `GET /api/v1/auth/me` | Bearer token | email + `rolCodigo` = BD | JSON vs `SELECT` | Alta |
| Entorno Docker | `docker-compose.yml`, `.env` | `docker compose config` | `APP_SEED_*` y `JWT_SECRET` coherentes | Valores resueltos | Media |
| Reglas negocio | `ProductoController`, etc. | — | ADMIN/AUX escriben productos | 403/201 según rol | Media |

---

## Referencias rápidas

- Script: `database/dev_verify_and_seed.sql`
- Semilla: `backend/.../DataInitializer.java`
- Propiedades: `backend/src/main/resources/application.yml` (`app.seed`)
- Docker: `docker-compose.yml` (variables `APP_SEED_*`)
