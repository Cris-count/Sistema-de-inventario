import type { PublicPlanDto } from './public-plan.model';

export interface CapacityResource {
  key: 'bodegas' | 'usuarios' | 'productos';
  label: string;
  used: number | null;
  limit: number | null;
  usagePct: number | null;
  status: 'ok' | 'near' | 'full' | 'unknown';
  helper: string;
}

export interface EmpresaCapacidadSnapshot {
  plan: PublicPlanDto | null;
  resources: CapacityResource[];
  errors: string[];
}
