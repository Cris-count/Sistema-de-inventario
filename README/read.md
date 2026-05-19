# Informe: backend Spring Boot — endpoints y posibles problemas

Revisión estática del código en `backend/` y de `docs/endpoints.md` (sin ejecutar la aplicación ni pruebas).

---

## 1. Alineación con la documentación (`docs/endpoints.md`)

| Tema | Estado | Nota |
|------|--------|------|
| `POST /auth/logout` | **No implementado** | El doc lo marca como opcional; el código solo tiene login y `GET /auth/me`. |
| `GET /auth/me` — forma del cuerpo | **Diferente al doc** | El doc habla de “Usuario + rol” genérico; la API devuelve `TokenResponse.UserSummary` (`rolCodigo`, `rolNombre`). Coherente con el front, no con la tabla del doc. |
| `GET /usuarios` — filtro `activo` | **No implementado** | Doc: query `activo`; `UsuarioController` usa `findAll(pageable)` sin filtro. |
| `GET /productos` — `q`, `categoriaId`, `activo` | **No implementado** | Doc prevé filtros; `ProductoController` solo `findAll(pageable)`. |
| `GET /categorias` — filtro `activo` | **No implementado** | Doc menciona filtros; implementación es `findAll()`. |
| `GET /reportes/movimientos` (paginado) | **No implementado** | Doc lo lista; `ReporteController` solo tiene `GET /reportes/kardex` y `GET /reportes/movimientos/export`. |
| `GET /auditoria/eventos` | **No implementado** | Doc lo marca opcional (RF-15). |
| Rutas de movimientos | **Coinciden en espíritu** | Bajo `/api/v1/movimientos`: `entradas`, `salidas`, `transferencias`, `ajustes`, listado y detalle — alineado con el doc (nombres en plural). |

---

## 2. Manejo de errores y respuestas HTTP

| Problema | Dónde | Riesgo |
|----------|--------|--------|
| **`GlobalExceptionHandler` incompleto** | Solo `BusinessException`, `MethodArgumentNotValidException`, `BadCredentialsException`, `AccessDeniedException`. | Faltan mapeos habituales: `NoSuchElementException` (muchos `orElseThrow()` en controladores), `DataIntegrityViolationException` (unicidad en BD), `HttpMessageNotReadableException`, `MissingServletRequestParameterException` (p. ej. fechas obligatorias en movimientos/reportes), etc. |
| **`orElseThrow()` sin mensaje** | `ProductoController`, `CategoriaController`, `BodegaController`, `ProveedorController`, `UsuarioController` (varios), etc. | Suele traducirse en **500** con cuerpo poco útil en lugar de **404** ProblemDetail, lejos de las convenciones del propio doc (`404` no encontrado). |
| **`CurrentUserService.requireUsuario()`** | `findByEmail(email).orElseThrow()` sin tipo de excepción de negocio. | Si el contexto de seguridad no coincide con un usuario en BD, respuesta poco controlada (típicamente **500**). |
| **Conflictos de negocio ya cubiertos** | `MovimientoService` usa `BusinessException` (stock, proveedor, etc.). | Bien para stock insuficiente y reglas claras; **no** hay equivalente explícito al crear producto/bodega/proveedor con **código o documento duplicado** (puede acabar en error de persistencia no traducido a `409`). |

---

## 3. Contrato de endpoints (parámetros y uso)

| Endpoint | Observación |
|----------|-------------|
| `GET /api/v1/movimientos` | `desde` y `hasta` son **obligatorios** (`LocalDate` sin `required = false`). Si faltan, error de binding (comportamiento por defecto de Spring, no unificado con ProblemDetail salvo configuración adicional). |
| `GET /api/v1/reportes/kardex` | Igual: `productoId`, `desde`, `hasta` obligatorios. |
| `GET /api/v1/reportes/movimientos/export` | `desde` y `hasta` obligatorios. |
| `POST` creación (producto, bodega, proveedor, categoría) | Poca validación de **unicidad** en capa de aplicación; la BD puede ser quien falle. |

---

## 4. Seguridad

| Tema | Evaluación breve |
|------|------------------|
| JWT + `@PreAuthorize` | Coherente; roles como `ADMIN`, `AUX_BODEGA`, etc. |
| CORS | Orígenes fijos `localhost:4200` y `127.0.0.1:4200`. Otro host/puerto del front → bloqueo CORS (no es “bug” del dominio, es configuración). |
| CSRF | Deshabilitado (típico con JWT stateless). |
| Actuator | Expuesto `health` (y en configuración global de actuator puede haber más; conviene revisar `application.yml` en despliegue). |
| **Logout / revocación** | No hay blacklist ni rotación de refresh; tokens válidos hasta expiración (esperable en MVP sin `POST /auth/logout`). |

---

## 5. Modelo de datos y serialización

| Tema | Riesgo |
|------|--------|
| `Producto.categoria` es **LAZY** | Con `open-in-view: true` en `application.yml`, el listado paginado de productos suele serializar bien; si en el futuro se desactiva OIV o se exponen DTOs distintos, aparecen riesgos de `LazyInitializationException` o **N+1** en consultas. |
| Entidades JPA como respuesta JSON | Expone el modelo de persistencia directamente (acoplado, posibles ciclos o campos sensibles si se añaden relaciones sin `@JsonIgnore`). `Usuario` ya ignora `passwordHash`. |

---

## 6. Lógica de negocio (revisión rápida)

| Área | Comentario |
|------|------------|
| Movimientos | Uso de `BusinessException` para stock, proveedor inactivo, líneas de ajuste, etc. — razonable. |
| Stock inicial | Evita duplicar stock existente por producto+bodega — coherente. |
| Export CSV | Construcción manual de CSV; si `movimiento.getUsuario()` fuera nulo en datos corruptos, habría riesgo de NPE (poco probable con integridad referencial). |
| Consulta kardex | JPQL con `ORDER BY` y paginación: en algunas versiones de Spring Data hay que vigilar advertencias o límites de ordenación en SQL generado (revisión operativa, no error de compilación). |

---

## 7. Resumen de brechas y deudas prioritarias

1. **Brecha doc ↔ código**: logout, listado paginado de reportes de movimientos, filtros en usuarios/productos/categorías.
2. **Errores “404/409” poco uniformes**: muchos `orElseThrow()` y violaciones de unicidad sin traducción a ProblemDetail.
3. **Handler global limitado**: faltan tipos de excepción frecuentes en APIs REST.
4. **Parámetros obligatorios** en reportes e historial de movimientos: sin documentación explícita en Swagger más allá del código, fácil obtener 400 no homogéneos.
5. **Exposición de entidades** y **LAZY** en producto: deuda técnica para evolución del API.

---

*Generado como revisión estática; no sustituye pruebas de integración ni análisis de seguridad en profundidad.*
