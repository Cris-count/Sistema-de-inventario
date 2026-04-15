/**
 * Roles con acceso de lectura a maestros y reportes alineados con el backend
 * (@PreAuthorize en GET de productos, bodegas, inventario, movimientos, reportes).
 */
export const ROLES_LECTURA_API: string[] = ['ADMIN', 'SUPER_ADMIN', 'AUX_BODEGA', 'COMPRAS', 'GERENCIA'];

/** Alta/edición/estado de productos: administración y operación de bodega (mercancía nueva). */
export const ROLES_GESTION_PRODUCTOS: string[] = ['ADMIN', 'SUPER_ADMIN', 'AUX_BODEGA'];

/** Solo administración: categorías, bodegas escritura, usuarios, stock inicial (según rutas). */
export const ROLES_ADMIN: string[] = ['ADMIN', 'SUPER_ADMIN'];

/** Entrada de mercancía: backend permite ADMIN, SUPER_ADMIN, AUX_BODEGA, COMPRAS. */
export const ROLES_ENTRADA: string[] = ['ADMIN', 'SUPER_ADMIN', 'AUX_BODEGA', 'COMPRAS'];

/** Salida, transferencia, ajuste: ADMIN, SUPER_ADMIN, AUX_BODEGA. */
export const ROLES_MOVIMIENTO_BODEGA: string[] = ['ADMIN', 'SUPER_ADMIN', 'AUX_BODEGA'];

/** Proveedores: lectura ADMIN, SUPER_ADMIN, COMPRAS, GERENCIA; escritura ADMIN/SUPER_ADMIN (UI en proveedores.page). */
export const ROLES_PROVEEDOR_LECTURA: string[] = ['ADMIN', 'SUPER_ADMIN', 'COMPRAS', 'GERENCIA'];
