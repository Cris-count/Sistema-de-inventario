# Pruebas (API)

## Postman

- **Archivo:** [postman/inventory-api.postman_collection.json](postman/inventory-api.postman_collection.json)
- **Importar:** Postman → Import → elegir el archivo.
- **Variables:** `baseUrl` = `http://localhost:8080/api/v1` (ajustar host/puerto si corresponde).
- **Orden:** las carpetas van numeradas (1 Auth → 2 Setup → …). El **Setup** crea datos con sufijo único (`{{suf}}`) para evitar conflictos de unicidad en BD.

## Smoke API (CLI sin dependencias externas)

Con la API y PostgreSQL en marcha (`docker compose up -d` desde la raíz del repo):

```bash
npm install
npm run test:api
```

El comando ejecuta `tests/api/smoke-api.mjs`, que valida:

- `GET /actuator/health` en `http://localhost:8080/actuator/health`
- `POST /api/v1/auth/login` con el usuario ADMIN semilla

Variables opcionales:

- `API_BASE_URL` (default `http://localhost:8080/api/v1`)
- `HEALTH_URL` (default `http://localhost:8080/actuator/health`)
- `API_ADMIN_EMAIL` (default `admin@inventario.local`)
- `API_ADMIN_PASSWORD` (default `Admin123!`)
- `API_REQUEST_TIMEOUT_MS` (default `30000`)

## Documentación

- Evidencia y tabla de cobertura: [../docs/pruebas-api.md](../docs/pruebas-api.md)
- Checklist demo: [../docs/checklist-validacion-final.md](../docs/checklist-validacion-final.md)

## Backend (JUnit)

`backend/src/test/java` — ejecutar con `mvn -f backend/pom.xml verify`.
