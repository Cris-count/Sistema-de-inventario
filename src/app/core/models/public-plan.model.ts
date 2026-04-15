export type PlanTipo = 'TRIAL' | 'PAGO' | 'EMPRESARIAL';

/**
 * Contrato público de planes para landing y onboarding.
 * `id` y `codigo` se mantienen iguales para evitar mapeos ambiguos.
 */
export interface PublicPlanDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcionCorta: string;
  descripcion: string;
  precio: number;
  precioMensual: number;
  moneda: string;
  maxBodegas: number;
  maxUsuarios: number;
  features: string[];
  recomendado: boolean;
  tipo: PlanTipo;
}
