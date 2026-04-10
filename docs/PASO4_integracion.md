# PASO 4 — Validación global, optimización y preparación backend

## 1. Validación global del proyecto

### Coherencia RF ↔ modelo de datos

| Área | Estado | Nota |
|------|--------|------|
| Usuarios y roles | Coherente | `usuario` → `rol`; sin tabla `permiso` (RBAC por rol acordado). |
| Productos/categorías/bodegas/proveedores | Coherente | Maestros con `activo` y UNIQUE donde corresponde. |
| Movimientos | Coherente | Cabecera `movimiento` + `movimiento_detalle`; tipos ENTRADA/SALIDA/TRANSFERENCIA/AJUSTE. |
| Trazabilidad | Coherente | `usuario_id` en cabecera; timestamps. |
| Proveedor en compra | Coherente | `proveedor_id` en cabecera de entrada (no exige N:M producto–proveedor). |

### Ajustes realizados (correcciones)

1. **Columna `motivo` en `movimiento`:** los RF pedían motivo explícito en entradas/salidas; el esquema inicial no lo tenía. Se añadió en `schema.sql` y migración `001_*` para bases ya creadas.
2. **RF-15 sin tabla dedicada:** aceptable para MVP; endpoint opcional alimentado por logs o futura tabla `auditoria_evento`.

### Inconsistencias resueltas

- **Conteo físico (RF-14):** se modela como movimiento tipo **AJUSTE** con líneas validadas en servicio (no duplicar “entidad conteo” salvo que se requiera acta formal en BD; para académico basta flujo de ajuste).

### Funcionalidad clave no cubierta por datos

- **Reservas de stock** y **lotes/caducidad:** fuera de alcance MVP; no bloquean el flujo base.

### Redundancia / sobreingeniería evitada

- No se añadió tabla `alerta_stock` (derivable por consulta).
- No se fragmentó microservicios (ver sección 8).

---

## 2. Optimización del sistema

| Mejora | Por qué |
|--------|---------|
| Motivo en cabecera | Evita ambigüedad entre “compra” y “ajuste” en reportes. |
| Endpoints por tipo de movimiento (`/entradas`, `/salidas`, …) | Facilita `@PreAuthorize` por rol en Spring sin ifs enormes en un solo POST genérico. |
| Inventario híbrido | Tabla `inventario` + historial: equilibrio rendimiento/trazabilidad. |
| CSV en lugar de XLSX para requisitos | Mismo contenido importable a Excel; mejor para Git. |

---

## 8. Preparación backend (Spring Boot)

### De tablas a entidades JPA

- Entidad `@Entity` por tabla; `inventario` con `@EmbeddedId` o `@IdClass` para clave compuesta `(producto_id, bodega_id)`.
- Relaciones: `@ManyToOne` en detalle hacia `Movimiento`, `Producto`, `Bodega`; `@OneToMany` desde `Movimiento` a líneas.
- Enums Java: `TipoMovimiento`, `EstadoMovimiento` mapeados a `VARCHAR` o `@Enumerated(STRING)`.

### Repositorios

- `JpaRepository` por agregado: `UsuarioRepository`, `ProductoRepository`, `MovimientoRepository`, `InventarioRepository`, etc.
- Consultas: `@Query` para kardex, alertas (`cantidad <= stock_minimo` join producto).

### Servicios

- `AuthService`, `UsuarioService`, `CatalogoService` (categoría/producto), `BodegaService`, `ProveedorService`.
- **`MovimientoService`** (núcleo): métodos transaccionales `registrarEntrada`, `registrarSalida`, `registrarTransferencia`, `registrarAjuste` que:
  1. Validan reglas de negocio.
  2. Persisten cabecera + detalles.
  3. Actualizan filas `inventario` con bloqueo (`@Lock(PESSIMISTIC_WRITE)` o `SELECT FOR UPDATE`).

### Arquitectura

- **Monolito modular** recomendado para proyecto académico y equipo pequeño: un único deploy, paquetes por dominio (`auth`, `catalogo`, `inventario`, `reportes`). Microservicios **no** recomendados aquí (complejidad operativa sin beneficio claro).

### Seguridad

- Spring Security + JWT (o sesión); `UserDetails` con rol; mapeo `rol.codigo` → autorities.

---

## 10. Validación final

| Pregunta | Respuesta |
|----------|-----------|
| ¿Coherente de extremo a extremo? | Sí, tras añadir `motivo` y documentar RF-15 opcional. |
| ¿Implementable sin bloqueos? | Sí: monolito, PostgreSQL, contrato en `endpoints.md`. |
| ¿Listo para backend? | Sí: DDL + migración + lista de endpoints + colección Postman. |
| ¿Flujo completo? | Entradas/salidas/transferencias cubiertas por servicio + endpoints dedicados. |
| ¿Endpoints cubren el sistema? | Sí; RF-15 y RF-16 marcados como opcionales/menor prioridad. |

---

## Supuestos cuestionados y decisión

- **¿Un solo POST `/movimientos`?** Viable, pero peor para autorización por rol; se prefirieron rutas explícitas.
- **¿Microservicios?** Rechazados para este alcance.
- **¿Producto–proveedor N:M?** No requerido; el negocio pide trazabilidad en la **compra** (cabecera), no catálogo de ofertas por producto.
