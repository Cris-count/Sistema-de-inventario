/**
 * Diccionario único código técnico → etiqueta humana de módulos de plan.
 * Los códigos están alineados con `PlanEntitlementCodes` del backend.
 *
 * Fuente única reutilizable por:
 *  - `/app/mi-empresa` (recomendación contextual y matriz de capacidades)
 *  - Landing pública (comparativa de planes)
 *
 * Si un código no está en la tabla, los consumidores caen al código técnico
 * (comportamiento conservador: mejor mostrar algo legible por humanos que nada).
 */
export const MODULO_LABELS: Readonly<Record<string, string>> = Object.freeze({
  inventario_basico: 'Inventario básico y productos',
  categorias: 'Categorías',
  movimientos_basicos: 'Entradas y salidas',
  consulta_stock: 'Consulta de existencias y alertas de stock',
  multi_bodega: 'Varias bodegas',
  transferencias: 'Transferencias entre bodegas',
  ajustes_inventario: 'Ajustes de inventario',
  proveedores: 'Proveedores',
  usuarios: 'Gestión de usuarios del equipo',
  configuracion_empresa: 'Datos y configuración de la empresa',
  reportes_basicos: 'Reportes básicos (kardex y exportación)',
  historial_movimientos: 'Historial y detalle de movimientos',
  reportes_avanzados: 'Reportes avanzados',
  roles_avanzados: 'Roles avanzados',
  auditoria: 'Auditoría',
  multi_sede: 'Multi-sede',
  integraciones: 'Integraciones',
  soporte_prioritario: 'Soporte prioritario'
});

/** Resuelve la etiqueta humana; cae al código técnico si no está mapeado. */
export function moduloLabel(code: string): string {
  return MODULO_LABELS[code] ?? code;
}
