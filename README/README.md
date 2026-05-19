# Sistema de Inventario

Sistema web multiempresa para gestion de inventario, movimientos de stock, abastecimiento, ventas POS y administracion basica de planes. El repositorio integra una aplicacion Angular en la raiz, una API REST Spring Boot en `backend/`, una base PostgreSQL inicializable desde Docker y scripts de apoyo para desarrollo local.

La documentacion esta escrita para presentacion academica/profesional y para mantenimiento tecnico. Describe el estado real del codigo actual; cuando una capacidad depende de configuracion externa o tiene alcance limitado, se indica explicitamente.

## Objetivo del Proyecto

El objetivo es centralizar operaciones frecuentes de inventario para una empresa: catalogo de productos, bodegas, proveedores, saldos por bodega, movimientos, reportes, alertas de stock y ventas. El sistema tambien incluye una capa SaaS/multiempresa con planes, limites funcionales, registro de empresas y flujos de pago con Stripe.

## Funcionalidades Principales

- Autenticacion con JWT, refresh token, cierre de sesion y soporte MFA.
- Separacion multiempresa: usuarios, productos, inventario, movimientos, clientes y ventas se consultan por empresa.
- Roles operativos: `SUPER_ADMIN`, `ADMIN`, `AUX_BODEGA`, `COMPRAS`, `VENTAS` y `GERENCIA`.
- Catalogos de productos, categorias, bodegas, proveedores, clientes y usuarios.
- Inventario por producto y bodega, con alertas por minimo y panel de abastecimiento.
- Movimientos transaccionales: entrada, salida, transferencia, ajuste, stock inicial y salida por venta.
- Modulo de ventas con historial, resumen operativo, CSV, detalle y comprobante operativo imprimible.
- POS para el rol `VENTAS`, con carrito, validacion de stock, cobro en efectivo y cobro con tarjeta mediante Stripe Checkout.
- Landing publica y registro/onboarding de empresas con planes.
- Integracion con correo de desarrollo mediante Mailpit para pruebas de notificaciones.

## Tecnologias Utilizadas

| Capa | Tecnologia |
|------|------------|
| Frontend | Angular 21, componentes standalone, RxJS, HttpClient, Angular Router |
| UI y estilos | CSS propio, tokens de diseno, Tailwind CSS v4, animaciones Angular y GSAP en landing |
| Backend | Java 17, Spring Boot 3.2.5, Spring Web, Spring Security, Spring Data JPA, Bean Validation |
| Persistencia | PostgreSQL 16 en Docker, Hibernate con `ddl-auto: validate` |
| Seguridad | JWT HS256, refresh tokens, BCrypt, MFA/TOTP, rate limiting en memoria o Redis |
| Pagos | Stripe Java SDK y Stripe Checkout |
| Documentacion API | springdoc-openapi / Swagger UI |
| Pruebas | Angular test builder, Maven tests con H2/Testcontainers segun caso, coleccion Postman/Newman |

## Arquitectura General

El backend es un monolito modular Spring Boot. La organizacion principal separa controladores REST, DTOs, servicios de negocio, entidades JPA, repositorios, seguridad, facturacion, onboarding, multiempresa y manejo de errores. La seguridad efectiva se aplica en servidor con `@PreAuthorize`, carga del usuario actual y validacion del tenant.

El frontend es una SPA Angular ubicada en `src/`, no dentro de `frontend/`. Usa rutas lazy, guards de autenticacion/rol, interceptor HTTP para el token y servicios `core/api` alineados con los controladores del backend. `frontend/` contiene documentacion, no el codigo fuente principal.

La base de datos se define en `database/schema.sql` para bases nuevas. Las migraciones en `database/migrations/` son scripts SQL idempotentes usados para alinear volumenes existentes; no hay Flyway ni Liquibase.

## Estructura del Proyecto

| Ruta | Contenido |
|------|-----------|
| `src/` | Aplicacion Angular: rutas, paginas publicas, shell autenticado, modulos funcionales, servicios y estilos. |
| `backend/` | API Spring Boot, Maven Wrapper, controladores, servicios, entidades, repositorios y pruebas backend. |
| `database/schema.sql` | Esquema completo para inicializar una base vacia. |
| `database/migrations/` | Migraciones SQL idempotentes para evolucion del esquema. |
| `scripts/` | Scripts Node para levantar frontend, stack Docker, sincronizar migraciones y resetear la base local. |
| `docs/` | Documentacion complementaria de endpoints, datos, reglas y validaciones. |
| `tests/postman/` | Coleccion Postman ejecutable con Newman. |
| `docker-compose.yml` | Servicios de desarrollo: PostgreSQL, API Spring Boot, ai-service y Mailpit. |
| `frontend/README.md` | Guia tecnica del cliente Angular. |
| `backend/README.md` | Guia tecnica del API. |
| `src/app/shared/motion/README.md` | Politica de uso de motion y GSAP. |

## Requisitos Previos

- Node.js compatible con el proyecto Angular actual. En esta maquina se valido sintaxis con Node 22; el proyecto declara `npm@10.9.4`.
- npm.
- Docker Desktop o Docker Engine con Compose.
- JDK 17 o superior para ejecutar el backend fuera del contenedor.
- Opcional: cuenta y claves Stripe para probar flujos reales de Checkout.

## Instalacion

Desde la raiz del repositorio:

```bash
npm install
```

El backend usa Maven Wrapper dentro de `backend/`, por lo que no es obligatorio instalar Maven globalmente.

## Configuracion del Entorno

El frontend usa `src/environments/environment.ts` en desarrollo y `environment.prod.ts` en produccion. Actualmente `apiUrl` apunta a `/api/v1`; `ng serve` usa `proxy.conf.json` para reenviar `/api` a `http://127.0.0.1:8080`.

El backend lee su configuracion desde `backend/src/main/resources/application.yml` y variables de entorno. Variables relevantes:

| Variable | Uso |
|----------|-----|
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL. Por defecto local: `jdbc:postgresql://127.0.0.1:5433/inventario`. |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Credenciales de base de datos. |
| `JWT_SECRET` | Secreto obligatorio para firmar JWT. Debe tener longitud suficiente para HS256. |
| `STRIPE_SECRET_KEY` | Habilita creacion y consulta de sesiones Stripe Checkout. |
| `STRIPE_PUBLIC_KEY` | Clave publica disponible para entornos que la requieran. |
| `STRIPE_WEBHOOK_SECRET` | Valida webhooks reales de Stripe. Si esta vacio, el webhook Stripe responde no disponible. |
| `APP_BILLING_FRONTEND_BASE_URL` | URL base usada en `success_url` y `cancel_url` de Stripe. Por defecto `http://localhost:4200`. |
| `BILLING_API_SECRET` | Secreto para endpoints internos de billing no Stripe. |
| `SPRING_MAIL_HOST` / `SPRING_MAIL_PORT` | SMTP para correos; en Docker dev se usa Mailpit. |
| `APP_SEED_*` | Correos y contrasenas de usuarios semilla. |

Puede copiarse `.env.example` a `.env` en la raiz para variables de Docker y del script de backend. No se deben versionar secretos reales.

## Base de Datos y Migraciones

PostgreSQL se publica en el host como `localhost:5433` y dentro del contenedor como `db:5432`. La base, usuario y contrasena por defecto son `inventario`.

En un volumen nuevo, Docker ejecuta `database/schema.sql` mediante `/docker-entrypoint-initdb.d/01-schema.sql`. En volumenes existentes, ese init no se repite; para eso existe `npm run db:sync`, que ejecuta las migraciones listadas en `scripts/db-sync-dev.mjs` desde `001` hasta `021`.

Comandos utiles:

```bash
npm run db
npm run db:sync
npm run db:reset
```

`npm run db:reset` prepara un reset de la base local y muestra una advertencia. Para borrar realmente los volumenes de Docker debe confirmarse de forma explicita:

```bash
npm run db:reset -- --yes
```

## Ejecucion Local

Flujo recomendado para desarrollo actual:

```bash
npm run up
```

El script levanta el stack Docker con build, espera PostgreSQL en `127.0.0.1:5433`, aplica migraciones idempotentes, **reinicia** el contenedor `api`, espera **en paralelo** el health de `ai-service` (`http://localhost:8000/health`) y del backend (`http://localhost:8080/actuator/health`), y después inicia Angular en modo desarrollo. Si querés iniciar solo el REST sin esperar el microservicio de IA: `SKIP_AI_HEALTH=1 npm run up` (Windows PowerShell: `$env:SKIP_AI_HEALTH=1; npm run up`).

En resumen, `npm run up` espera:
- PostgreSQL
- Migraciones + reinicio del `api`
- Health de ai-service y API (en paralelo; el AI puede omitirse con `SKIP_AI_HEALTH`)

URLs principales:

| Servicio | URL |
|----------|-----|
| Frontend | `http://localhost:4200` |
| API REST | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| API Health | `http://localhost:8080/actuator/health` |
| AI Health | `http://localhost:8000/health` |
| Mailpit dev | `http://localhost:8025` |

Controles manuales utiles:

```bash
curl http://localhost:8000/health
curl http://localhost:8080/actuator/health
```

Para ejecucion manual por partes:

```bash
docker compose up -d --build
npm run frontend
```

Si se desea ejecutar el backend fuera de Docker, puede usarse el script raiz:

```bash
npm run backend
```

Tambien puede usarse Maven Wrapper directamente desde `backend/`:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

En macOS/Linux:

```bash
cd backend
./mvnw spring-boot:run
```

## Scripts Importantes

| Script | Descripcion |
|--------|-------------|
| `npm run up` | Levanta Docker completo, sincroniza migraciones, reinicia API y sirve el frontend. |
| `npm run down` | Ejecuta `docker compose down` sin borrar volumenes. |
| `npm run db` | Levanta solo el servicio PostgreSQL. |
| `npm run db:sync` | Aplica migraciones SQL idempotentes en el contenedor `db`. |
| `npm run db:reset` | Muestra advertencia de reset; para borrar volumenes requiere `npm run db:reset -- --yes`. |
| `npm run frontend` | Ejecuta `ng serve` en desarrollo, buscando puerto libre desde `4200`. |
| `npm start` / `npm run dev` | Alias de `npm run frontend`. |
| `npm run backend` | Ejecuta Spring Boot local con Maven Wrapper desde `backend/` y carga `.env` si existe. |
| `npm run build` | Build de produccion Angular. |
| `npm run test` | Pruebas frontend. |
| `npm run ci` | Build Angular + pruebas sin watch. |
| `npm run test:api` | Coleccion Postman con Newman; requiere API disponible. |

## Roles Principales

| Rol | Alcance actual |
|-----|----------------|
| `SUPER_ADMIN` | Permisos equivalentes a administracion en la API actual; tambien puede asignar `SUPER_ADMIN`. |
| `ADMIN` | Configuracion de empresa, usuarios, maestros, modulos operativos y anulacion de ventas. |
| `AUX_BODEGA` | Gestion operativa de productos, stock inicial y movimientos de bodega segun permisos. |
| `COMPRAS` | Entradas, consulta de stock, proveedores y abastecimiento. |
| `VENTAS` | POS, registro de ventas, consulta de stock, historial propio y reportes visibles por rol. |
| `GERENCIA` | Consulta de inventario, reportes y ventas; no registra nuevas ventas desde la UI. |

El cliente oculta o reordena navegacion segun rol y modulos del plan, pero la autorizacion real esta en el backend.

## Modulos Implementados

- Landing publica (`/landing`) y registro de empresas (`/registro`).
- Login, refresh token, logout, MFA y sesion con `GET /auth/me`.
- Shell autenticado en `/app`.
- Dashboard ejecutivo-operativo con KPIs, prioridades y actividad reciente.
- Mi empresa, planes y checkout de cambio de plan.
- Productos, categorias, bodegas, proveedores y clientes.
- Inventario, alertas, stock inicial y panel de abastecimiento.
- Movimientos: entrada, salida, transferencia, ajuste, historial y detalle.
- Reportes: Kardex y exportacion CSV de movimientos.
- Ventas/POS: carrito, cobro, historial, resumen operativo, CSV, detalle y comprobante.
- Usuarios y mensajes de pedido a proveedor.

## Flujo de Ventas / POS

El modulo de ventas esta en `/app/ventas`. Para usuarios con rol `VENTAS`, el dashboard generico redirige al POS y el menu prioriza ventas, movimientos, reportes e inventario. Para `ADMIN` y `SUPER_ADMIN`, la pantalla muestra un panel mas clasico con formulario de venta y analisis operativo. `GERENCIA` puede consultar ventas, totales y detalle, pero no registrar ventas.

Una venta siempre pertenece a una empresa, una bodega, un vendedor y opcionalmente un cliente. Las lineas usan productos activos, cantidad mayor a cero y precio unitario no negativo. Para roles no administrativos, el backend rechaza lineas con precio unitario `0`; los administradores pueden registrar ventas de importe cero desde el flujo clasico, no desde Stripe.

El historial permite filtrar por fechas, bodega, estado, cliente, codigo y vendedor cuando el rol lo permite. El rol `VENTAS` solo ve sus propias ventas; administracion y gerencia ven ventas de la empresa segun permisos.

### Cobro en Efectivo

En POS, el boton `Cobrar en efectivo` abre un panel para capturar el monto recibido. La UI calcula el cambio y solo permite confirmar si el efectivo cubre el total. Al confirmar, el frontend llama `POST /api/v1/ventas`.

En backend, `VentaService.crear` registra la venta como `CONFIRMADA`, asigna `metodoPago = EFECTIVO`, marca `paidAt`, guarda `montoRecibido` y `cambio` si fueron enviados, crea el movimiento `SALIDA_POR_VENTA` y descuenta stock en la misma transaccion. La respuesta incluye el `movimientoId`.

### Cobro con Tarjeta por Stripe

En POS, el boton `Cobrar con tarjeta` llama `POST /api/v1/ventas/stripe/preparar`. Ese endpoint valida la venta, crea una venta `PENDIENTE_PAGO` con `metodoPago = STRIPE` y `pagoEstado = STRIPE_PENDING`, pero no descuenta inventario ni crea movimiento todavia. Despues crea una sesion Stripe Checkout y devuelve la URL de pago.

Cuando Stripe redirige de vuelta a `/app/ventas/pago-retorno`, el frontend llama `POST /api/v1/ventas/{id}/stripe/sincronizar` con el `session_id`. El backend consulta Stripe, verifica que la sesion este `paid` y `complete`, valida metadata, monto y empresa, y recien entonces crea el movimiento `SALIDA_POR_VENTA`, descuenta stock, marca la venta como `CONFIRMADA`, cambia `pagoEstado` a `STRIPE_SUCCEEDED` y guarda `paidAt`.

El webhook `POST /api/v1/billing/stripe/webhook` tambien recibe `checkout.session.completed`. Si la metadata indica `flowType = POS_VENTA`, delega en el servicio de ventas POS y aplica la misma finalizacion idempotente. Si el webhook no esta configurado o llega tarde, la sincronizacion desde la pantalla de retorno actua como respaldo autenticado.

Si el usuario cancela en Stripe, la venta queda `PENDIENTE_PAGO` y el stock no se descuenta. Desde la pantalla de retorno se puede llamar `POST /api/v1/ventas/{id}/cancelar-pendiente`, que marca la venta como `CANCELADA_SIN_PAGO` y `STRIPE_CANCELLED`, sin movimiento de inventario.

### Comprobante y Anulacion

El comprobante en `/app/ventas/recibo/:id` solo se muestra para ventas `CONFIRMADA`. Es un comprobante operativo imprimible; el propio codigo aclara que no constituye factura de venta ni documento equivalente tributario.

La anulacion de ventas confirmadas esta restringida a `ADMIN` y `SUPER_ADMIN`. Al anular, el backend revierte el stock asociado al movimiento `SALIDA_POR_VENTA`, marca el movimiento como `ANULADO` y cambia la venta a `ANULADA`. En ventas Stripe, esta anulacion operativa no implica ni confirma un reembolso en Stripe; el CSV y la UI lo aclaran para evitar confundir reversion de inventario con devolucion de dinero.

## Semantica de Inventario

El saldo actual vive en `inventario` por producto y bodega. Los cambios de stock se registran mediante movimientos con detalle:

- `ENTRADA`: suma stock en bodega destino.
- `SALIDA`: descuenta stock desde bodega origen.
- `TRANSFERENCIA`: descuenta origen y suma destino.
- `AJUSTE`: suma o descuenta segun la linea tenga destino u origen.
- `SALIDA_POR_VENTA`: descuenta stock por una venta confirmada.

Las operaciones de escritura son transaccionales. Si no hay existencias o el stock es insuficiente, el backend responde con error de negocio y no persiste parcialmente la operacion.

## Animaciones y GSAP

GSAP esta instalado y se usa de forma controlada, principalmente en la landing publica. Existen helpers compartidos en `src/app/shared/motion/`: `withGsapContext`, `runWhenVisible`, `appGsapReveal` y `appGsapHover`. Se usan en secciones como hero, features, trust, business visual, product showcase y CTA.

La politica actual es no sobreusar GSAP en pantallas operativas. POS, inventario, CRUD, tablas y reportes deben priorizar estabilidad, legibilidad y CSS/animaciones Angular simples. Cualquier contribucion futura de motion debe respetar `prefers-reduced-motion`, limpiar contextos al destruir componentes y preferir transform/opacity sobre propiedades de layout.

Ver `src/app/shared/motion/README.md` para la politica completa.

## Limitaciones y Consideraciones Actuales

- No hay Flyway/Liquibase: el versionado de base depende de `schema.sql`, migraciones SQL manuales e idempotencia.
- El comprobante de venta no es facturacion electronica.
- La anulacion de una venta Stripe revierte inventario en el sistema, pero no ejecuta ni registra reembolso en Stripe.
- Stripe requiere configuracion real de `STRIPE_SECRET_KEY` y, para webhooks, `STRIPE_WEBHOOK_SECRET`.
- El webhook Stripe queda no disponible si no hay secreto configurado; la pantalla de retorno puede sincronizar pagos como respaldo.
- El frontend oculta opciones por rol y plan, pero no sustituye la autorizacion del backend.
- `open-in-view` esta activo en JPA; conviene revisarlo si el proyecto evoluciona hacia DTOs estrictos en todos los controladores.
- Algunos documentos historicos en `docs/` pueden contener contexto de fases anteriores; este README refleja el estado auditado del codigo actual.

## Proximos Pasos Sugeridos

- Automatizar migraciones con una herramienta formal si el proyecto pasa de demostracion/desarrollo a operacion sostenida.
- Anadir pruebas especificas de POS efectivo/Stripe y anulacion operativa.
- Documentar una matriz completa de endpoints y permisos si se usa como entrega formal extendida.
- Definir estrategia real de facturacion/reembolso si el modulo de ventas se integra con operacion comercial en produccion.

## Documentacion Complementaria

- `backend/README.md`: guia tecnica del API.
- `frontend/README.md`: guia tecnica del cliente Angular.
- `src/app/shared/motion/README.md`: politica de motion y GSAP.
- `docs/endpoints.md`: contrato HTTP complementario.
- `docs/modelo_datos.md`: modelo de datos.
- `tests/README.md`: pruebas Postman/Newman.
