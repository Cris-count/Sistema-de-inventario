import type { PublicPlanDto } from '../models/public-plan.model';

/**
 * Precio mensual para UI (landing, registro). COP: formato colombiano con prefijo $.
 */
export function formatPlanPrecioMensual(p: Pick<PublicPlanDto, 'precioMensual' | 'moneda' | 'tipo'>): string {
  const monto = Number(p.precioMensual);
  if (p.tipo === 'EMPRESARIAL' && monto <= 0) {
    return 'A medida';
  }
  if (monto <= 0) {
    return 'Consultar';
  }
  const entero = Math.round(monto);
  if (p.moneda === 'COP') {
    return `$${entero.toLocaleString('es-CO')}`;
  }
  return `${p.moneda} ${entero.toLocaleString('es-CO')}`;
}

export function planMensualCadence(p: Pick<PublicPlanDto, 'precioMensual' | 'tipo'>): string {
  return Number(p.precioMensual) > 0 ? '/mes' : '';
}
