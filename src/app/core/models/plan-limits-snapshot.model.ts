/** Límites efectivos del plan (p. ej. desde `GET /empresa/mi`). `null` = ilimitado. */
export interface PlanLimitsFromMiEmpresa {
  maxBodegas: number | null;
  maxUsuarios: number | null;
  maxProductos: number | null;
}
