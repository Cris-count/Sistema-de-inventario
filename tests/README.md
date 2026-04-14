# Pruebas (API)

## Postman

- **Archivo:** [postman/inventory-api.postman_collection.json](postman/inventory-api.postman_collection.json)
- **Importar:** Postman → Import → elegir el archivo.
- **Variables:** `baseUrl` = `http://localhost:8080/api/v1` (ajustar host/puerto si corresponde).
- **Orden:** las carpetas van numeradas (1 Auth → 2 Setup → …). El **Setup** crea datos con sufijo único (`{{suf}}`) para evitar conflictos de unicidad en BD.

## Newman (CLI)

Con la API y PostgreSQL en marcha (`docker compose up -d` desde la raíz del repo):

```bash
npm install
npm run test:api
```

Equivale a: `newman run tests/postman/inventory-api.postman_collection.json --delay-request 150 --timeout-request 30000`

## Documentación

- Evidencia y tabla de cobertura: [../docs/pruebas-api.md](../docs/pruebas-api.md)
- Checklist demo: [../docs/checklist-validacion-final.md](../docs/checklist-validacion-final.md)

## Backend (JUnit)

`backend/src/test/java` — ejecutar con `mvn -f backend/pom.xml verify`.
