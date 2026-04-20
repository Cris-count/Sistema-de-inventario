export type PlanTipo = 'TRIAL' | 'PAGO' | 'EMPRESARIAL';

/**
 * Contrato público de planes para landing, onboarding y recomendación contextual.
 * `id` y `codigo` se mantienen iguales para evitar mapeos ambiguos.
 *
 * Campos `modulos` y `maxProductos` son proyectados desde el `PlanEntitlementsRegistry`
 * del backend (fuente única). Opcionales por compatibilidad con versiones anteriores
 * del backend: si el contrato nuevo aún no está desplegado, los consumidores deben caer
 * a heurísticas conservadoras (`recomendado: true` / `features`).
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
  /** Códigos técnicos (p. ej. `transferencias`, `reportes_avanzados`). `null` si backend viejo. */
  modulos?: string[];
  /** Tope de productos del plan; `null` = ilimitado. Opcional por compatibilidad. */
  maxProductos?: number | null;
}
