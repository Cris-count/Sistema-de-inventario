# Auditoria segura de dependencias npm

Fecha: 2026-05-19

## Alcance

Esta auditoria cubre las dependencias npm del frontend Angular y las herramientas Node.js usadas desde la raiz del proyecto. No se modificaron backend, Docker ni base de datos.

## Comandos ejecutados

```bash
npm audit --json
npm view newman version
npm view @angular/ssr version
npm view vite version
npm view postcss version
npm audit fix
npm audit fix
npm install --package-lock-only --ignore-scripts
npm ci
npm run build
npm run test -- --watch=false
npm run test:api
npm audit --json
```

No se ejecuto `npm audit fix --force`.

## Cambios aplicados

- Se actualizo Angular dentro del mismo major version, de `21.2.x` a `21.2.11`, incluyendo `@angular/platform-server`, `@angular/ssr`, `@angular/build`, `@angular/cli` y `@angular/compiler-cli`.
- Se actualizo `postcss` a `8.5.15`.
- Se actualizo `newman` a `6.2.2`, ultima version disponible compatible de la rama 6.x.
- Se regenero `package-lock.json` desde el `package.json` actualizado.

## Vulnerabilidades corregidas

El reporte inicial tenia 25 vulnerabilidades: 12 moderadas, 12 altas y 1 critica.

Quedaron corregidas las vulnerabilidades relacionadas con:

- `@angular/platform-server`
- `@angular/ssr`
- `@angular/build`
- `vite`
- `postcss`
- `brace-expansion`
- `fast-uri`
- `hono`
- `ip-address`

El reporte final tiene 15 vulnerabilidades: 5 moderadas, 9 altas y 1 critica.

## Vulnerabilidades restantes

Las vulnerabilidades restantes estan asociadas a `newman` y dependencias transitivas de Postman Runtime:

- `handlebars`: critica/alta/moderada, via `postman-runtime`.
- `lodash`: alta/moderada, via `newman`, `postman-runtime`, `postman-collection`, `postman-sandbox`.
- `node-forge`: alta/moderada, via `postman-runtime`.
- `flatted`: alta, via `uvm` y `postman-sandbox`.
- `underscore`: alta, via `httpntlm` y `postman-runtime`.
- `qs`: moderada, via `postman-request`.
- `jose`: moderada, via `postman-runtime`.

`npm audit` propone corregir este grupo con `npm audit fix --force`, pero eso instalaria `newman@2.1.2`, un downgrade mayor y rompiente frente a `newman@6.2.2`. Esa correccion fue rechazada.

## Clasificacion de riesgo

Riesgo real de produccion:

- Bajo para el bundle Angular actual, porque `newman` esta en `devDependencies` y solo se usa para pruebas API.
- Angular/Vite/PostCSS quedaron actualizados dentro de rangos compatibles.
- `@angular/ssr` y `@angular/platform-server` se mantienen porque existen archivos SSR (`src/server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts`). Si SSR se publica en produccion, debe mantenerse actualizado como ahora.

Riesgo de desarrollo/testing:

- Medio a alto en entornos donde `npm run test:api` procese colecciones Postman no confiables o datos externos no controlados.
- Control actual: ejecutar Newman solo con colecciones versionadas/confiables del repositorio y sin exponerlo como servicio publico.

Riesgo por dependencia transitiva sin fix seguro:

- Newman/Postman Runtime arrastra dependencias vulnerables y `npm audit` no ofrece una actualizacion segura hacia adelante.
- El downgrade sugerido a `newman@2.1.2` no es aceptable porque puede romper CLI, colecciones y compatibilidad moderna.

## Pruebas realizadas

```bash
npm ci
npm run build
npm run test -- --watch=false
```

Resultados:

- `npm ci`: exitoso.
- `npm run build`: exitoso. Persisten warnings no bloqueantes por budget CSS y `qrcode` CommonJS.
- `npm run test -- --watch=false`: exitoso, 1 archivo de prueba y 2 tests pasando.
- `npm run test:api`: Newman ejecuta, pero falla porque no habia backend escuchando en `127.0.0.1:8080` (`ECONNREFUSED`). No se detecto fallo de instalacion ni de CLI.

## Recomendaciones

- No usar `npm audit fix --force` mientras proponga degradar Newman a `2.1.2`.
- Mantener `newman` en `devDependencies`.
- En CI, ejecutar `npm run test:api` solo despues de levantar backend y base de datos.
- Revisar periodicamente si Newman/Postman Runtime publica una version que actualice sus transitivas vulnerables sin downgrade.
- Si las vulnerabilidades de Newman son inaceptables para el entorno, evaluar migrar la ejecucion API a una herramienta con dependencias mantenidas o aislar Newman en un job/container de testing sin secretos productivos.
