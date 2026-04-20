/** Códigos alineados con `PlanEntitlementCodes` del backend (matriz de planes). */
export const PlanEntitlementCodes = {
  inventario_basico: 'inventario_basico',
  categorias: 'categorias',
  movimientos_basicos: 'movimientos_basicos',
  consulta_stock: 'consulta_stock',
  multi_bodega: 'multi_bodega',
  transferencias: 'transferencias',
  ajustes_inventario: 'ajustes_inventario',
  proveedores: 'proveedores',
  usuarios: 'usuarios',
  configuracion_empresa: 'configuracion_empresa',
  reportes_basicos: 'reportes_basicos',
  historial_movimientos: 'historial_movimientos',
  reportes_avanzados: 'reportes_avanzados',
  roles_avanzados: 'roles_avanzados',
  auditoria: 'auditoria',
  multi_sede: 'multi_sede',
  integraciones: 'integraciones',
  soporte_prioritario: 'soporte_prioritario'
} as const;

export type PlanEntitlementCode = (typeof PlanEntitlementCodes)[keyof typeof PlanEntitlementCodes];
