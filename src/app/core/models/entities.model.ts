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
  /** API serializa `stockMinimo` como número (BigDecimal); la UI acepta ambos. */
  stockMinimo: string | number;
  purchaseCost: string | number;
  salePrice: string | number;
  proveedorPreferidoId?: number | null;
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
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  unidadMedida: string;
  productoActivo: boolean;
  bodegaId: number;
  bodegaCodigo: string;
  bodegaNombre: string;
  cantidad: string;
  stockMinimo: string | number;
  bajoMinimo: boolean;
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

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'SALIDA_POR_VENTA' | 'TRANSFERENCIA' | 'AJUSTE';

export interface VentaPanelResumen {
  ventasHoy: number;
  unidadesVendidasHoy: number;
  totalVendidoHoy: number;
  ventasUltimos7Dias: number;
}

/** Fase 3: resumen operativo por rango (API /ventas/resumen-operativo). */
export interface VentaProductoRankingItem {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidadVendida: number;
  subtotalConfirmado: number;
}

export interface VentaVendedorBucketItem {
  usuarioId: number;
  usuarioEmail: string;
  ventasConfirmadas: number;
  totalMonto: number;
}

export interface VentaBodegaBucketItem {
  bodegaId: number;
  bodegaNombre: string;
  ventasConfirmadas: number;
  totalMonto: number;
}

export interface VentaOperativoResumen {
  fechaDesde: string;
  fechaHasta: string;
  ventasConfirmadas: number;
  totalVendidoConfirmado: number;
  unidadesVendidasConfirmadas: number;
  ventasAnuladas: number;
  montoVentasAnuladasSnapshot: number;
  topProductos: VentaProductoRankingItem[];
  porVendedor: VentaVendedorBucketItem[];
  porBodega: VentaBodegaBucketItem[];
}

export interface VentaListItem {
  id: number;
  codigoPublico: string;
  fechaVenta: string;
  bodegaId: number;
  bodegaNombre: string;
  total: number;
  cantidadLineas: number;
  usuarioId: number;
  usuarioEmail: string;
  movimientoId: number | null;
  estado: string;
  clienteId?: number | null;
  clienteNombre?: string | null;
  /** EFECTIVO para cobro directo; STRIPE para Checkout con tarjeta. */
  metodoPago?: string | null;
  /** STRIPE_* para ciclo Stripe; null para efectivo/directo. */
  pagoEstado?: string | null;
}

export interface VentaDetalleLine {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDetailResponse {
  id: number;
  codigoPublico: string;
  fechaVenta: string;
  bodegaId: number;
  bodegaNombre: string;
  total: number;
  estado: string;
  observacion?: string;
  usuarioId: number;
  usuarioEmail: string;
  /** Nombre del vendedor (y apellido si existe en el maestro). */
  usuarioNombre?: string | null;
  movimientoId: number | null;
  movimientoEstado: string | null;
  clienteId?: number | null;
  clienteNombre?: string | null;
  clienteDocumento?: string | null;
  clienteTelefono?: string | null;
  lineas: VentaDetalleLine[];
  metodoPago?: string | null;
  pagoEstado?: string | null;
  paidAt?: string | null;
  montoRecibido?: number | null;
  cambio?: number | null;
  stripeCheckoutSessionId?: string | null;
  /** Razón social / nombre de la empresa (tenant). */
  empresaNombre?: string | null;
  /** Etiqueta operativa de medio de pago para comprobantes. */
  metodoPagoEtiqueta?: string | null;
}

export interface VentaLineRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface VentaCreateRequest {
  bodegaId: number;
  clienteId?: number | null;
  observacion?: string;
  montoRecibido?: number | null;
  lineas: VentaLineRequest[];
}

export interface VentaCreatedResponse {
  id: number;
  codigoPublico: string;
  movimientoId: number;
  fechaVenta: string;
  total: number;
  estado: string;
}

/** Respuesta de POST /ventas/stripe/preparar (POS + Stripe Checkout). */
export interface VentaStripePrepararResponse {
  ventaId: number;
  codigoPublico: string;
  total: number;
  estadoVenta: string;
  checkoutUrl: string;
  stripeSessionId: string;
}

/** Catálogo mínimo de clientes para ventas (Fase 2). */
export interface ClienteListItem {
  id: number;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
}

export interface ClienteCreateRequest {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
}

export interface MovimientoList {
  id: number;
  tipoMovimiento: TipoMovimiento;
  motivo?: string;
  fechaMovimiento: string;
  referenciaDocumento?: string;
  observacion?: string;
  estado: string;
  usuarioId?: number | null;
  usuarioEmail?: string | null;
  usuarioNombre?: string | null;
  proveedorId?: number | null;
  proveedorRazonSocial?: string | null;
  totalLineas: number;
  anulado: boolean;
  completado: boolean;
  interpretacionStock: string;
}

export interface KardexBodegaImpacto {
  bodegaOrigenId?: number | null;
  bodegaOrigenNombre?: string | null;
  bodegaDestinoId?: number | null;
  bodegaDestinoNombre?: string | null;
  cantidad: string | number;
}

export interface KardexMovimiento {
  id: number;
  movimientoId: number;
  tipoMovimiento: TipoMovimiento;
  estado: string;
  motivo?: string | null;
  referenciaDocumento?: string | null;
  fechaMovimiento: string;
  usuarioId?: number | null;
  usuarioEmail?: string | null;
  productoId: number;
  productoCodigo?: string | null;
  productoNombre?: string | null;
  cantidadMovimiento: string | number;
  bodegas: KardexBodegaImpacto[];
  anulado: boolean;
  interpretacionStock: string;
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

/** GET /inventario/panel-abastecimiento */
export interface AbastecimientoPanelResponse {
  resumen: {
    totalLineasReposicion: number;
    sinStock: number;
    criticos: number;
    bajoMinimo: number;
    entradasHoy: number;
  };
  productos: ProductoPorReponerRow[];
}

export interface ProductoPorReponerRow {
  productoId: number;
  codigo: string;
  nombre: string;
  bodegaId: number;
  nombreBodega: string;
  stockActual: string;
  stockMinimo: string;
  estadoReposicion: string;
  proveedorId: number | null;
  proveedorNombre: string | null;
  fuenteProveedor: string | null;
  fechaUltimaEntrada: string | null;
  puedeRegistrarEntrada: boolean;
}
