/**
 * Roles con acceso de lectura a maestros y reportes alineados con el backend
 * (@PreAuthorize en GET de productos, bodegas, inventario, movimientos, reportes).
 */
export const ROLES_LECTURA_API: string[] = ['ADMIN', 'AUX_BODEGA', 'COMPRAS', 'GERENCIA'];

/** Alta/edición/estado de productos: administración y operación de bodega (mercancía nueva). */
export const ROLES_GESTION_PRODUCTOS: string[] = ['ADMIN', 'AUX_BODEGA'];

/** Solo administración: categorías, bodegas escritura, usuarios, stock inicial (según rutas). */
export const ROLES_ADMIN: string[] = ['ADMIN'];

/** Entrada de mercancía: backend permite ADMIN, AUX_BODEGA, COMPRAS. */
export const ROLES_ENTRADA: string[] = ['ADMIN', 'AUX_BODEGA', 'COMPRAS'];

/** Salida, transferencia, ajuste: ADMIN, AUX_BODEGA. */
export const ROLES_MOVIMIENTO_BODEGA: string[] = ['ADMIN', 'AUX_BODEGA'];

/** Proveedores: lectura ADMIN, COMPRAS, GERENCIA; escritura solo ADMIN (UI en proveedores.page). */
export const ROLES_PROVEEDOR_LECTURA: string[] = ['ADMIN', 'COMPRAS', 'GERENCIA'];
