import {
  ROLES_ADMIN,
  ROLES_ENTRADA,
  ROLES_LECTURA_API,
  ROLES_PANEL_ABASTECIMIENTO,
  ROLES_MOVIMIENTO_BODEGA,
  ROLES_PROVEEDOR_LECTURA,
  ROLES_VENTAS_PANEL
} from './auth/app-roles';
import { PlanEntitlementCodes } from './plan-entitlement-codes';

/** Enlaces de navegación; `roles` vacío = todos los autenticados. */
export interface NavItem {
  /** Segmentos relativos a `/app` (ej. `['movimientos','entrada']`). */
  parts: string[];
  label: string;
  /** Emoji representativo (visible siempre; con menú expandido va junto al texto). */
  icon: string;
  roles: string[];
  /**
   * Si se define, el usuario debe tener al menos uno de estos códigos de módulo del plan
   * (según `GET /empresa/mi`). Vacío / ausente = no filtrar por plan.
   */
  requiresAnyPlanModule?: string[];
  /**
   * Etiqueta de agrupación en el sidebar (solo presentación; no afecta rutas).
   * Ítems consecutivos con el mismo texto se dibujan bajo un mismo encabezado de grupo.
   */
  navSection: string;
}

export const NAV_ITEMS: NavItem[] = [
  { parts: ['dashboard'], label: 'Inicio', icon: '🏠', roles: [], navSection: 'General' },
  { parts: ['mi-empresa'], label: 'Mi empresa', icon: '🏢', roles: ROLES_ADMIN, navSection: 'General' },
  {
    parts: ['productos'],
    label: 'Productos',
    icon: '📦',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.inventario_basico],
    navSection: 'Catálogo'
  },
  {
    parts: ['categorias'],
    label: 'Categorías',
    icon: '🗂️',
    roles: ROLES_ADMIN,
    requiresAnyPlanModule: [PlanEntitlementCodes.categorias],
    navSection: 'Catálogo'
  },
  {
    parts: ['bodegas'],
    label: 'Bodegas',
    icon: '🏭',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.inventario_basico],
    navSection: 'Catálogo'
  },
  {
    parts: ['proveedores'],
    label: 'Proveedores',
    icon: '🤝',
    roles: ROLES_PROVEEDOR_LECTURA,
    requiresAnyPlanModule: [PlanEntitlementCodes.proveedores],
    navSection: 'Catálogo'
  },
  {
    parts: ['inventario'],
    label: 'Inventario',
    icon: '📊',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.consulta_stock],
    navSection: 'Inventario'
  },
  {
    parts: ['abastecimiento'],
    label: 'Abastecimiento',
    icon: '📋',
    roles: ROLES_PANEL_ABASTECIMIENTO,
    requiresAnyPlanModule: [PlanEntitlementCodes.consulta_stock],
    navSection: 'Inventario'
  },
  {
    parts: ['ventas'],
    label: 'Ventas',
    icon: '🛒',
    roles: ROLES_VENTAS_PANEL,
    requiresAnyPlanModule: [PlanEntitlementCodes.consulta_stock],
    navSection: 'Ventas'
  },
  {
    parts: ['mensajes-pedido'],
    label: 'Mensajes pedido',
    icon: '✉️',
    roles: ROLES_ADMIN,
    requiresAnyPlanModule: [PlanEntitlementCodes.consulta_stock],
    navSection: 'Inventario'
  },
  {
    parts: ['stock-inicial'],
    label: 'Stock inicial',
    icon: '📥',
    roles: ROLES_ADMIN,
    requiresAnyPlanModule: [PlanEntitlementCodes.inventario_basico],
    navSection: 'Inventario'
  },
  {
    parts: ['movimientos'],
    label: 'Historial mov.',
    icon: '📜',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.historial_movimientos],
    navSection: 'Movimientos'
  },
  {
    parts: ['movimientos', 'entrada'],
    label: 'Entrada',
    icon: '➕',
    roles: ROLES_ENTRADA,
    requiresAnyPlanModule: [PlanEntitlementCodes.movimientos_basicos],
    navSection: 'Movimientos'
  },
  {
    parts: ['movimientos', 'salida'],
    label: 'Salida',
    icon: '➖',
    roles: ROLES_MOVIMIENTO_BODEGA,
    requiresAnyPlanModule: [PlanEntitlementCodes.movimientos_basicos],
    navSection: 'Movimientos'
  },
  {
    parts: ['movimientos', 'transferencia'],
    label: 'Transferencia',
    icon: '🔀',
    roles: ROLES_MOVIMIENTO_BODEGA,
    requiresAnyPlanModule: [PlanEntitlementCodes.transferencias],
    navSection: 'Movimientos'
  },
  {
    parts: ['movimientos', 'ajuste'],
    label: 'Ajuste',
    icon: '⚙️',
    roles: ROLES_MOVIMIENTO_BODEGA,
    requiresAnyPlanModule: [PlanEntitlementCodes.ajustes_inventario],
    navSection: 'Movimientos'
  },
  {
    parts: ['reportes', 'kardex'],
    label: 'Kardex',
    icon: '📑',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.reportes_basicos, PlanEntitlementCodes.reportes_avanzados],
    navSection: 'Reportes'
  },
  {
    parts: ['reportes', 'export'],
    label: 'Exportar CSV',
    icon: '📤',
    roles: ROLES_LECTURA_API,
    requiresAnyPlanModule: [PlanEntitlementCodes.reportes_basicos, PlanEntitlementCodes.reportes_avanzados],
    navSection: 'Reportes'
  },
  {
    parts: ['usuarios'],
    label: 'Usuarios',
    icon: '👥',
    roles: ROLES_ADMIN,
    requiresAnyPlanModule: [PlanEntitlementCodes.usuarios],
    navSection: 'Administración'
  }
];

export function navVisibleForRole(role: string | null, item: NavItem): boolean {
  if (!item.roles.length) return true;
  return !!role && item.roles.includes(role);
}

/** `planModules` null = aún no cargado o sin dato: no se oculta por plan (evita menú vacío). */
export function navVisibleForPlan(item: NavItem, planModules: Set<string> | null): boolean {
  const req = item.requiresAnyPlanModule;
  if (!req?.length) return true;
  if (!planModules) return true;
  return req.some((c) => planModules.has(c));
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
