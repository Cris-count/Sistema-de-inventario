/** Enlaces de navegación; `roles` vacío = todos los autenticados. */
export interface NavItem {
  /** Segmentos relativos a `/app` (ej. `['movimientos','entrada']`). */
  parts: string[];
  label: string;
  roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { parts: ['dashboard'], label: 'Inicio', roles: [] },
  { parts: ['productos'], label: 'Productos', roles: [] },
  { parts: ['categorias'], label: 'Categorías', roles: ['ADMIN'] },
  { parts: ['bodegas'], label: 'Bodegas', roles: [] },
  { parts: ['proveedores'], label: 'Proveedores', roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] },
  { parts: ['inventario'], label: 'Inventario', roles: [] },
  { parts: ['stock-inicial'], label: 'Stock inicial', roles: ['ADMIN'] },
  { parts: ['movimientos'], label: 'Historial mov.', roles: [] },
  { parts: ['movimientos', 'entrada'], label: 'Entrada', roles: ['ADMIN', 'AUX_BODEGA', 'COMPRAS'] },
  { parts: ['movimientos', 'salida'], label: 'Salida', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['movimientos', 'transferencia'], label: 'Transferencia', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['movimientos', 'ajuste'], label: 'Ajuste', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['reportes', 'kardex'], label: 'Kardex', roles: [] },
  { parts: ['reportes', 'export'], label: 'Exportar CSV', roles: [] },
  { parts: ['usuarios'], label: 'Usuarios', roles: ['ADMIN'] }
];

export function navVisibleForRole(role: string | null, item: NavItem): boolean {
  if (!item.roles.length) return true;
  return !!role && item.roles.includes(role);
}

/** `routerLinkActive` exacto: evita marcar "Historial" al estar en /movimientos/entrada. */
export function navExactActive(item: NavItem): boolean {
  return item.parts.length === 1 && item.parts[0] === 'movimientos';
}
