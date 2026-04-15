export interface EmpresaActualDto {
  id: number;
  nombre: string;
  identificacion: string | null;
  emailContacto: string | null;
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
