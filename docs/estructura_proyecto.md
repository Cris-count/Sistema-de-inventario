# Estructura de carpetas del proyecto

El repositorio actual sigue esta organización (equivalente a `inventario-system/`):

```
Sistema-de-inventario/          # raíz del repositorio Git
├── docs/                       # Documentación de proceso, RF, modelo, endpoints (PASO 4)
├── database/                   # SQL PostgreSQL + migraciones
│   ├── schema.sql
│   ├── reset_dev.sql
│   └── migrations/
├── backend/                    # Proyecto Spring Boot (pendiente de generar)
├── tests/                      # Colecciones API y pruebas E2E futuras
│   └── postman/
├── src/                        # Frontend Angular (aplicación ya existente)
├── public/
├── angular.json
├── package.json
└── docker-compose.yml          # PostgreSQL para desarrollo
```

## Qué va en cada carpeta

| Carpeta | Contenido | Archivos típicos |
|---------|-----------|------------------|
| **docs/** | Entregables académicos y contrato de API | `paso1_proceso.md`, `requisitos.csv`, `historias_usuario.md`, `reglas_negocio.md`, `modelo_datos.md`, `endpoints.md`, `PASO4_integracion.md` |
| **database/** | Esquema y evolución del DDL | `schema.sql`, `migrations/*.sql` |
| **backend/** | API REST, seguridad, JPA | `pom.xml`, `src/main/java`, `application.yml` |
| **frontend/** | *(opcional)* Si en el futuro se mueve el Angular aquí; hoy el front vive en **`src/`** en la raíz. |
| **tests/** | Postman/Bruno, pruebas automatizadas | `inventory-api.postman_collection.json` |

## Nota sobre `requisitos.xlsx`

Se entrega **`docs/requisitos.csv`** (UTF-8). En Excel: *Datos → Obtener datos → Desde texto/CSV* o abrir el archivo y elegir delimitador coma. Evita dependencias binarias y versionado limpio en Git.

## Frontend

No se renombró `src/` a `frontend/` para no romper el proyecto Angular actual. El PASO 4 asume **un solo frontend** en la raíz; migrar a subcarpeta `frontend/` es opcional cuando se estabilice el monorepo.
