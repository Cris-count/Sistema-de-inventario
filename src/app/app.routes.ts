import { Routes } from '@angular/router';
import {
  ROLES_ADMIN,
  ROLES_ENTRADA,
  ROLES_GESTION_PRODUCTOS,
  ROLES_LECTURA_API,
  ROLES_PANEL_ABASTECIMIENTO,
  ROLES_MOVIMIENTO_BODEGA,
  ROLES_PROVEEDOR_LECTURA,
  ROLES_VENTAS_PANEL
} from './core/auth/app-roles';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';
import { syncUserGuard } from './core/auth/sync-user.guard';
import { ventasSkipGenericDashboardGuard } from './core/auth/ventas-skip-dashboard.guard';

export const routes: Routes = [
  /** Home pública: /app exige JWT; la landing es el punto de entrada sin sesión. */
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing-page.component').then((m) => m.LandingPageComponent)
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register-page.component').then((m) => m.RegisterPageComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard, syncUserGuard],
    /** Vuelve a ejecutar guards al cambiar entre hijos (p. ej. dashboard → productos) para alinear rol con `/auth/me` y BD. */
    runGuardsAndResolvers: 'always',
    loadComponent: () => import('./shared/shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      /** `dashboard` + `ventasSkipGenericDashboardGuard` replica el rol que antes resolvía `defaultAppLandingGuard`. */
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [ventasSkipGenericDashboardGuard],
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'mi-empresa',
        canActivate: [roleGuard],
        data: { roles: ROLES_ADMIN },
        loadComponent: () => import('./features/empresa/mi-empresa.page').then((m) => m.MiEmpresaPage)
      },
      {
        path: 'productos',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        loadComponent: () => import('./features/productos/productos.page').then((m) => m.ProductosPage)
      },
      {
        path: 'categorias',
        canActivate: [roleGuard],
        data: { roles: ROLES_ADMIN },
        loadComponent: () => import('./features/categorias/categorias.page').then((m) => m.CategoriasPage)
      },
      {
        path: 'bodegas',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        loadComponent: () => import('./features/bodegas/bodegas.page').then((m) => m.BodegasPage)
      },
      {
        path: 'proveedores',
        canActivate: [roleGuard],
        data: { roles: ROLES_PROVEEDOR_LECTURA },
        loadComponent: () => import('./features/proveedores/proveedores.page').then((m) => m.ProveedoresPage)
      },
      {
        path: 'inventario',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        loadComponent: () => import('./features/inventario/inventario.page').then((m) => m.InventarioPage)
      },
      {
        path: 'abastecimiento',
        canActivate: [roleGuard],
        data: { roles: ROLES_PANEL_ABASTECIMIENTO },
        loadComponent: () =>
          import('./features/abastecimiento/abastecimiento.page').then((m) => m.AbastecimientoPage)
      },
      {
        path: 'ventas',
        canActivate: [roleGuard],
        data: { roles: ROLES_VENTAS_PANEL },
        loadComponent: () => import('./features/ventas/ventas.page').then((m) => m.VentasPage)
      },
      {
        path: 'ventas/pago-retorno',
        canActivate: [roleGuard],
        data: { roles: ROLES_VENTAS_PANEL },
        loadComponent: () =>
          import('./features/ventas/venta-pago-retorno.page').then((m) => m.VentaPagoRetornoPage)
      },
      {
        path: 'ventas/recibo/:id',
        canActivate: [roleGuard],
        data: { roles: ROLES_VENTAS_PANEL },
        loadComponent: () => import('./features/ventas/venta-recibo.page').then((m) => m.VentaReciboPage)
      },
      {
        path: 'ventas/detalle/:id',
        canActivate: [roleGuard],
        data: { roles: ROLES_VENTAS_PANEL },
        loadComponent: () =>
          import('./features/ventas/venta-detalle.page').then((m) => m.VentaDetallePage)
      },
      {
        path: 'mensajes-pedido',
        canActivate: [roleGuard],
        data: { roles: ROLES_ADMIN },
        loadComponent: () =>
          import('./features/mensajes-pedido/mensajes-pedido.page').then((m) => m.MensajesPedidoPage)
      },
      {
        path: 'stock-inicial',
        canActivate: [roleGuard],
        data: { roles: ROLES_GESTION_PRODUCTOS },
        loadComponent: () => import('./features/inventario/stock-inicial.page').then((m) => m.StockInicialPage)
      },
      {
        path: 'movimientos',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/movimientos/historial.page').then((m) => m.HistorialMovimientosPage)
          },
          {
            path: 'detalle/:id',
            loadComponent: () =>
              import('./features/movimientos/movimiento-detalle.page').then((m) => m.MovimientoDetallePage)
          },
          {
            path: 'entrada',
            canActivate: [roleGuard],
            data: { roles: ROLES_ENTRADA },
            loadComponent: () => import('./features/movimientos/entrada.page').then((m) => m.MovEntradaPage)
          },
          {
            path: 'salida',
            canActivate: [roleGuard],
            data: { roles: ROLES_MOVIMIENTO_BODEGA },
            loadComponent: () => import('./features/movimientos/salida.page').then((m) => m.MovSalidaPage)
          },
          {
            path: 'transferencia',
            canActivate: [roleGuard],
            data: { roles: ROLES_MOVIMIENTO_BODEGA },
            loadComponent: () =>
              import('./features/movimientos/transferencia.page').then((m) => m.MovTransferenciaPage)
          },
          {
            path: 'ajuste',
            canActivate: [roleGuard],
            data: { roles: ROLES_MOVIMIENTO_BODEGA },
            loadComponent: () => import('./features/movimientos/ajuste.page').then((m) => m.MovAjustePage)
          }
        ]
      },
      {
        path: 'reportes/kardex',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        loadComponent: () => import('./features/reportes/kardex.page').then((m) => m.KardexPage)
      },
      {
        path: 'reportes/export',
        canActivate: [roleGuard],
        data: { roles: ROLES_LECTURA_API },
        loadComponent: () => import('./features/reportes/export.page').then((m) => m.ExportReportePage)
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ROLES_ADMIN },
        loadComponent: () => import('./features/usuarios/usuarios.page').then((m) => m.UsuariosPage)
      }
    ]
  },
  { path: '**', redirectTo: 'landing' }
];
