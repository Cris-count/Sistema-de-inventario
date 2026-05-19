# Frontend Angular

Esta carpeta contiene documentacion del frontend. El codigo real de la aplicacion Angular esta en la raiz del repositorio, principalmente en `src/`, `angular.json`, `package.json` y los archivos de entorno.

## Stack

- Angular 21 con componentes standalone.
- Angular Router con rutas lazy.
- RxJS y `HttpClient`.
- Interceptor HTTP para adjuntar JWT y tratar respuestas `401`.
- Guards de autenticacion, sesion sincronizada y rol.
- CSS del proyecto, tokens de diseno, Tailwind CSS v4 y animaciones controladas.
- GSAP limitado principalmente a la landing publica.

## Organizacion Principal

| Ruta | Proposito |
|------|-----------|
| `src/app/app.routes.ts` | Rutas publicas y autenticadas. |
| `src/app/core/auth/` | `AuthService`, guards y definicion de roles. |
| `src/app/core/api/` | Servicios HTTP para consumir `/api/v1`. |
| `src/app/core/models/` | Tipos usados por servicios y pantallas. |
| `src/app/core/navigation.ts` | Menu lateral, visibilidad por rol y filtros por modulo del plan. |
| `src/app/shared/shell/` | Layout autenticado con sidebar y `router-outlet`. |
| `src/app/pages/landing/` | Landing publica. |
| `src/app/pages/register/` | Registro/onboarding de empresas. |
| `src/app/features/` | Modulos funcionales autenticados. |
| `src/app/shared/motion/` | Helpers y directivas GSAP compartidas. |

## Rutas Relevantes

- `/` redirige a `/landing`.
- `/landing` muestra la landing publica.
- `/registro` permite iniciar el onboarding de empresa.
- `/login` inicia sesion.
- `/app` contiene el shell autenticado.
- `/app/dashboard` muestra el panel ejecutivo-operativo, salvo rol `VENTAS`, que se redirige a `/app/ventas`.
- `/app/ventas` contiene el panel de ventas y POS.
- `/app/ventas/pago-retorno` confirma o cancela retornos de Stripe.
- `/app/ventas/recibo/:id` muestra el comprobante operativo imprimible.

## Modulos de UI Implementados

- Dashboard con KPIs, prioridades, accesos rapidos y actividad reciente.
- Productos, categorias, bodegas, proveedores, clientes y usuarios.
- Inventario, alertas, stock inicial y abastecimiento.
- Movimientos: entrada, salida, transferencia, ajuste, historial y detalle.
- Reportes: Kardex y exportacion CSV.
- Ventas: POS, venta clasica, resumen operativo, historial, detalle y comprobante.
- Mi empresa, planes y checkout.

## Ventas y POS en el Frontend

La pantalla `src/app/features/ventas/ventas.page.ts` adapta su comportamiento al rol:

- `VENTAS`: interfaz tipo POS, carrito, carga inicial de bodega, productos disponibles, acciones de cobro y resumen compacto.
- `ADMIN` / `SUPER_ADMIN`: formulario clasico de venta y analisis operativo.
- `GERENCIA`: consulta de ventas, resumen y detalle, sin registro de nuevas ventas.

El POS valida bodega, lineas, stock disponible, cantidades, total y precio antes de permitir cobro. Para efectivo, captura `montoRecibido` y calcula cambio. Para Stripe, prepara una sesion Checkout y redirige fuera de la aplicacion.

La pantalla de retorno no asume exito por venir de Stripe; sincroniza con el backend y Stripe antes de mostrar la venta como confirmada.

## Configuracion de API

En desarrollo, `src/environments/environment.ts` define:

```ts
apiUrl: '/api/v1'
```

`proxy.conf.json` reenvia `/api` a `http://127.0.0.1:8080`. En produccion, `environment.prod.ts` tambien usa `/api/v1`, pensado para servir frontend y API bajo el mismo dominio o proxy inverso.

## Ejecucion

Desde la raiz del repositorio:

```bash
npm install
npm run frontend
```

Tambien funcionan:

```bash
npm start
npm run dev
```

`scripts/serve-frontend.mjs` inicia `ng serve` en modo development y busca un puerto libre a partir de `4200`. Si se requiere puerto estricto:

```bash
NG_STRICT_PORT=1 npm run frontend
```

## Build y Pruebas

```bash
npm run build
npm run test
npm run ci
```

El build de produccion genera salida bajo `dist/Inventario/browser/`.

## Seguridad en Cliente

El frontend filtra navegacion y rutas con guards, pero eso solo mejora experiencia de usuario. La seguridad real se aplica en el backend con JWT, `@PreAuthorize`, tenant actual y validaciones de negocio.

## Consideraciones

- El frontend no implementa facturacion electronica; el comprobante de venta es operativo.
- La navegacion por plan puede ocultar modulos cuando `GET /empresa/mi` informa capacidades.
- El uso de GSAP debe seguir la politica de `src/app/shared/motion/README.md`.
- Las pantallas operativas priorizan rendimiento y legibilidad sobre animaciones complejas.
