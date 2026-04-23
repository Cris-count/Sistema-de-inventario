export interface EmpresaActualDto {
  id: number;
  nombre: string;
  identificacion: string | null;
  emailContacto: string | null;
  /** Copia en alertas automáticas de pedido a proveedor; si falta, usa email de contacto. */
  emailNotificacionesInventario?: string | null;
  /** Activar o desactivar envío de correos al proveedor cuando el stock está en el mínimo. */
  alertasPedidoProveedorActivas?: boolean;
  /** Tope de unidades sugeridas por correo (null = sin tope en base de datos). */
  pedidoProveedorCantidadMaxima?: number | null;
  telefono: string | null;
  estado: string | null;
  planCodigo: string | null;
  planNombre: string | null;
  suscripcionEstado: string | null;
  /** Códigos de módulo habilitados para la empresa (matriz de plan). */
  modulosHabilitados?: string[];
  /** Límites efectivos; `null` = ilimitado en el plan. */
  maxUsuarios?: number | null;
  maxBodegas?: number | null;
  maxProductos?: number | null;
  /** Upgrade con pago pendiente (misma API de confirmación de billing). */
  cambioPlanPendientePagoId?: number | null;
  cambioPlanPendientePlanCodigo?: string | null;
  cambioPlanPendientePlanNombre?: string | null;
  cambioPlanPendienteCreadoAt?: string | null;
  cambioPlanPendienteExpiraAt?: string | null;
  /** Mensaje de normalización (ej. expiración automática) entregado por backend. */
  cambioPlanMensaje?: string | null;
}

export interface EmpresaMiUpdateRequest {
  nombre: string;
  emailContacto?: string | null;
  telefono?: string | null;
  emailNotificacionesInventario?: string | null;
  alertasPedidoProveedorActivas?: boolean;
  /** 0 o vacío vía UI se envía como 0 para quitar tope en el servidor. */
  pedidoProveedorCantidadMaxima?: number | null;
}

export interface CambioPlanSolicitudResponseDto {
  resultado: string;
  mensaje: string;
  compraId: number | null;
  pagoId: number | null;
  planCodigoSolicitado: string;
}

export interface CambioPlanCancelacionResponseDto {
  resultado: string;
  mensaje: string;
  compraId: number | null;
  pagoId: number | null;
}

export type CheckoutFlowMode = 'PURCHASE' | 'UPGRADE';
export type CheckoutResolution = 'SUCCESS' | 'FAILURE' | 'CANCELLED';
export type CheckoutProvider = 'STRIPE';

export interface CreateCheckoutSessionResponseDto {
  sessionId: string;
  compraId: number;
  pagoId: number;
  currentPlanCodigo: string | null;
  targetPlanCodigo: string;
  mode: CheckoutFlowMode;
  provider: CheckoutProvider;
  requiresRedirect: boolean;
  checkoutUrl: string | null;
  message: string;
}

export interface ResolveCheckoutSessionResponseDto {
  success: boolean;
  pagoId: number;
  compraId: number;
  currentPlanCodigo: string | null;
  targetPlanCodigo: string;
  mode: CheckoutFlowMode;
  result: CheckoutResolution;
  message: string;
}
