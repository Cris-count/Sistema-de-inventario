export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: Categoria;
  unidadMedida: string;
  stockMinimo: string;
  activo: boolean;
}

export interface Bodega {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  activo: boolean;
}

export interface Proveedor {
  id: number;
  documento: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface InventarioRow {
  id: { productoId: number; bodegaId: number };
  producto: Producto;
  bodega: Bodega;
  cantidad: string;
  updatedAt: string;
}

export interface UsuarioRow {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  rolCodigo: string;
  activo: boolean;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE';

export interface MovimientoList {
  id: number;
  tipoMovimiento: TipoMovimiento;
  motivo?: string;
  fechaMovimiento: string;
  referenciaDocumento?: string;
  observacion?: string;
  estado: string;
  usuario?: { id: number; email: string; nombre: string };
  proveedor?: Proveedor;
}

export interface MovimientoDetalleResponse {
  id: number;
  productoId: number;
  productoCodigo: string;
  cantidad: string;
  bodegaOrigenId?: number;
  bodegaDestinoId?: number;
}

export interface MovimientoResponse {
  id: number;
  tipoMovimiento: string;
  motivo?: string;
  referenciaDocumento?: string;
  estado: string;
  detalles: MovimientoDetalleResponse[];
}
