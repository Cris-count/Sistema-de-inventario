# Validación del SQL (PASO 3)

## ¿Ejecutable en PostgreSQL?

Sí. Probado con imagen `postgres:16-alpine` vía Docker Compose; tablas e índices se crean correctamente.

## Errores corregidos en PASO 4

- **Falta de `motivo` en cabecera:** se añadió `motivo VARCHAR(80)` a `movimiento` para alinear con RF de motivos sin duplicar lógica en cada línea.
- **Bases ya inicializadas:** ejecutar `database/migrations/001_add_movimiento_motivo.sql` o recrear volumen Docker (`docker compose down -v && docker compose up -d`).

## Redundancias

- `chk_producto_stock_min` y `CHECK` en columna `stock_minimo`: redundancia leve; se puede unificar en una sola restricción en evolución futura.

## Optimización

- Índices en `movimiento(fecha_movimiento)`, `movimiento_detalle(producto_id)` adecuados para kardex.
- `CREATE INDEX IF NOT EXISTS` en script: idempotente; en producción usar herramienta de migraciones (Flyway/Liquibase) con versionado explícito.

## Coherencia con JPA

- Nombres `snake_case` → `@Column(name = "...")` o `SpringPhysicalNamingStrategy` para camelCase en Java.
