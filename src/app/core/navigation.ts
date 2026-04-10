/** Enlaces de navegación; `roles` vacío = todos los autenticados. */
export interface NavItem {
  /** Segmentos relativos a `/app` (ej. `['movimientos','entrada']`). */
  parts: string[];
  label: string;
  /** Emoji representativo (visible siempre; con menú expandido va junto al texto). */
  icon: string;
  roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { parts: ['dashboard'], label: 'Inicio', icon: '🏠', roles: [] },
  { parts: ['productos'], label: 'Productos', icon: '📦', roles: [] },
  { parts: ['categorias'], label: 'Categorías', icon: '🗂️', roles: ['ADMIN'] },
  { parts: ['bodegas'], label: 'Bodegas', icon: '🏭', roles: [] },
  { parts: ['proveedores'], label: 'Proveedores', icon: '🤝', roles: ['ADMIN', 'COMPRAS', 'GERENCIA'] },
  { parts: ['inventario'], label: 'Inventario', icon: '📊', roles: [] },
  { parts: ['stock-inicial'], label: 'Stock inicial', icon: '📥', roles: ['ADMIN'] },
  { parts: ['movimientos'], label: 'Historial mov.', icon: '📜', roles: [] },
  { parts: ['movimientos', 'entrada'], label: 'Entrada', icon: '➕', roles: ['ADMIN', 'AUX_BODEGA', 'COMPRAS'] },
  { parts: ['movimientos', 'salida'], label: 'Salida', icon: '➖', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['movimientos', 'transferencia'], label: 'Transferencia', icon: '🔀', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['movimientos', 'ajuste'], label: 'Ajuste', icon: '⚙️', roles: ['ADMIN', 'AUX_BODEGA'] },
  { parts: ['reportes', 'kardex'], label: 'Kardex', icon: '📑', roles: [] },
  { parts: ['reportes', 'export'], label: 'Exportar CSV', icon: '📤', roles: [] },
  { parts: ['usuarios'], label: 'Usuarios', icon: '👥', roles: ['ADMIN'] }
];

export function navVisibleForRole(role: string | null, item: NavItem): boolean {
  if (!item.roles.length) return true;
  return !!role && item.roles.includes(role);
}

/** `routerLinkActive` exacto: evita marcar "Historial" al estar en /movimientos/entrada. */
export function navExactActive(item: NavItem): boolean {
  return item.parts.length === 1 && item.parts[0] === 'movimientos';
}

/**
 * Ítem de menú más específico que coincide con la URL actual (ruta bajo `/app`).
 * Usado p. ej. para mostrar el emoji del apartado activo en la marca superior.
 */
export function matchNavItemByUrl(url: string): NavItem | null {
  const path = url.split('?')[0];
  let segments = path
    .replace(/^\//, '')
    .split('/')
    .filter((s) => s.length > 0);
  if (segments[0] === 'app') {
    segments = segments.slice(1);
  }
  if (segments.length === 0) {
    return NAV_ITEMS.find((i) => i.parts.length === 1 && i.parts[0] === 'dashboard') ?? null;
  }
  let best: NavItem | null = null;
  for (const item of NAV_ITEMS) {
    const p = item.parts;
    if (p.length > segments.length) {
      continue;
    }
    let ok = true;
    for (let i = 0; i < p.length; i++) {
      if (p[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok && (!best || p.length > best.parts.length)) {
      best = item;
    }
  }
  return best;
}
