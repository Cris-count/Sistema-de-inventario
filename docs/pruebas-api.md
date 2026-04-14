# Pruebas de API — evidencia PASO 8

## Resumen

- **Colección Postman:** `tests/postman/inventory-api.postman_collection.json` (v3, carpetas ordenadas: Auth → Setup → Errores → Flujos ADMIN → roles AUX/COMPRAS/GERENCIA).
- **Automatización:** `npm run test:api` (smoke test Node.js), requiere API levantada.
- **Usuarios semilla** (por defecto): `admin@inventario.local` / `Admin123!`, `aux@inventario.local` / `AuxBodega123!`, `compras@inventario.local` / `Compras123!`, `gerencia@inventario.local` / `Gerencia123!`.

## Corrección aplicada durante la validación

Al serializar entidades JPA con relaciones lazy (`Page<Producto>` con `categoria`, etc.), Jackson fallaba con proxies Hibernate. Se añadió `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` en las entidades de dominio expuestas por los controladores. Sin esto, algunos GET devolvían error en cadena de filtros y el cliente veía **401** en lugar del JSON esperado.

## Colección Postman — ejecución real (evidencia histórica)

**Entorno:** Windows, Docker Compose, API `http://localhost:8080/api/v1`.

**Comando usado en esa corrida:** `npm run test:api` (cuando estaba implementado con Newman)

**Resultado:** 42 peticiones, 42 aserciones, **0 fallos** (duración ~13 s).

Cobertura incluida en la colección:

| Tema | Detalle |
|------|---------|
| Auth | Login los 4 roles; credenciales incorrectas → 401; `GET /auth/me` (ADMIN) |
| Setup | Categoría, bodegas, proveedor, producto, stock inicial (IDs vía `{{suf}}` único) |
| Errores | Sin token → 401; JWT inválido → 401; login vacío → **400**; COMPRAS POST producto → **403**; GERENCIA POST entrada → **403**; AUX GET usuarios → **403** |
| Flujo ADMIN | Usuarios, entrada COMPRA, salida OK, salida excesiva → **409**, transferencia, ajuste, inventario, historial, kardex, CSV |
| AUX | `auth/me`, POST y PUT producto, salida |
| COMPRAS | `auth/me`, GET productos, entrada RECEPCION, salida/transf./ajuste → **403** |
| GERENCIA | `auth/me`, inventario, kardex, POST producto → **403** |

## Códigos HTTP validados

| Código | Caso |
|--------|------|
| 200/201 | Operaciones correctas (crear maestros, movimientos, lecturas) |
| 400 | `POST /auth/login` con email/password vacíos (validación Bean Validation) |
| 401 | Sin `Authorization`, JWT mal formado o inválido |
| 403 | Rol insuficiente (`@PreAuthorize`) |
| 409 | Regla de negocio (p. ej. stock insuficiente en salida) |

## PowerShell (humo manual)

```powershell
$body = '{"email":"admin@inventario.local","password":"Admin123!"}'
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -Method GET
```

## CI

- `mvn -f backend/pom.xml verify` — tests unitarios/integración del backend según el proyecto.
- `npm run ci` — build Angular + tests del front.
- El smoke test API no está en CI por defecto (requiere API + BD en ejecución). Opción: job separado con servicios Docker.

## Frontend vs backend

- `environment.apiUrl` (`src/environments/environment.ts`) = `http://localhost:8080/api/v1` — alineado con controladores `/api/v1/...`.
- Servicios en `src/app/core/api/*.ts` usan rutas relativas bajo esa base (`/productos`, `/auth/login`, `/auth/me`, `/movimientos`, `/inventario`, `/reportes`, etc.).
- **No** se detectaron rutas obsoletas en el código del front respecto a los controladores actuales.
- Pruebas E2E automatizadas del navegador (Cypress/Playwright) **no** ejecutadas en esta fase.

## Qué quedó probado / parcial / no probado

| Ámbito | Estado |
|--------|--------|
| API por rol + flujos + códigos 400/401/403/409 | **Probado** (Newman + corrección Jackson/Hibernate) |
| Humo `/actuator/health` y login | **Probado** |
| UI Angular extremo a extremo automatizado | **No probado** |
| Carga/estrés | **No probado** |
| Despliegue en producción | **No probado** |

## Veredicto entrega académica

- **Listo para entrega académica** con documentación y evidencia de API: sí, con la condición de ejecutar `docker compose up` y `npm run test:api` (smoke) o repetir manualmente el checklist/colección Postman.
- **Cerrado técnicamente al 100%:** no declarable sin pipeline CI que ejecute Newman contra un entorno efímero; el núcleo funcional y la colección Postman están validados en ejecución real.
