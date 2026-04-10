import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';
import { syncUserGuard } from './core/auth/sync-user.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard, syncUserGuard],
    loadComponent: () => import('./shared/shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/productos/productos.page').then((m) => m.ProductosPage)
      },
      {
        path: 'categorias',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/categorias/categorias.page').then((m) => m.CategoriasPage)
      },
      {
        path: 'bodegas',
        loadComponent: () => import('./features/bodegas/bodegas.page').then((m) => m.BodegasPage)
      },
      {
        path: 'proveedores',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] },
        loadComponent: () => import('./features/proveedores/proveedores.page').then((m) => m.ProveedoresPage)
      },
      {
        path: 'inventario',
        loadComponent: () => import('./features/inventario/inventario.page').then((m) => m.InventarioPage)
      },
      {
        path: 'stock-inicial',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/inventario/stock-inicial.page').then((m) => m.StockInicialPage)
      },
      {
        path: 'movimientos',
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
            data: { roles: ['ADMIN', 'AUX_BODEGA', 'COMPRAS'] },
            loadComponent: () => import('./features/movimientos/entrada.page').then((m) => m.MovEntradaPage)
          },
          {
            path: 'salida',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN', 'AUX_BODEGA'] },
            loadComponent: () => import('./features/movimientos/salida.page').then((m) => m.MovSalidaPage)
          },
          {
            path: 'transferencia',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN', 'AUX_BODEGA'] },
            loadComponent: () =>
              import('./features/movimientos/transferencia.page').then((m) => m.MovTransferenciaPage)
          },
          {
            path: 'ajuste',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN', 'AUX_BODEGA'] },
            loadComponent: () => import('./features/movimientos/ajuste.page').then((m) => m.MovAjustePage)
          }
        ]
      },
      {
        path: 'reportes/kardex',
        loadComponent: () => import('./features/reportes/kardex.page').then((m) => m.KardexPage)
      },
      {
        path: 'reportes/export',
        loadComponent: () => import('./features/reportes/export.page').then((m) => m.ExportReportePage)
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/usuarios/usuarios.page').then((m) => m.UsuariosPage)
      }
    ]
  },
  { path: '**', redirectTo: 'app' }
];
