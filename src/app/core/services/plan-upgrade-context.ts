import { signal } from '@angular/core';

/**
 * Códigos `PLAN_*` relevantes para disparar una recomendación contextual de upgrade
 * en /app/mi-empresa. Son un subconjunto de los declarados en
 * `backend/.../service/saas/PlanBlockCodes.java`.
 *
 * Se excluyen:
 *  - `PLAN_CAMBIO_PENDIENTE_PAGO`: ya tiene UI dedicada (`#cambio-pendiente`).
 *  - `PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA`: tampoco debe invitar a otro cambio.
 */
const CONVERSION_TRIGGER_CODES: ReadonlySet<string> = new Set([
  'PLAN_LIMITE_USUARIOS',
  'PLAN_LIMITE_BODEGAS',
  'PLAN_LIMITE_PRODUCTOS',
  'PLAN_MODULO_NO_INCLUIDO',
  'PLAN_REPORTES_NO_INCLUIDO'
]);

/**
 * Contexto one-shot que viaja desde el lugar donde ocurre un bloqueo de plan
 * (17 pantallas que usan `patchPlanErrorSignals`) hasta `/app/mi-empresa`.
 *
 * `blockModule` sólo llega cuando el backend lo envía (ver
 * `BusinessException#blockModule` y `GlobalExceptionHandler`) y sólo aplica
 * para `PLAN_MODULO_NO_INCLUIDO` o `PLAN_REPORTES_NO_INCLUIDO`.
 */
export interface PlanUpgradeTrigger {
  blockCode: string;
  blockModule: string | null;
}

const _trigger = signal<PlanUpgradeTrigger | null>(null);

/**
 * Store in-memory (scope de sesión, sin `localStorage`) del último trigger de
 * conversión observado por el cliente. Lo alimenta `patchPlanErrorSignals` al
 * procesar un `HttpErrorResponse` con `PLAN_*` de conversión.
 *
 * MiEmpresaPage lo lee en `ngOnInit` con `consume()` (one-shot).
 * Sin persistencia: si el usuario recarga, simplemente no hay razón contextual
 * y se cae al fallback `recomendado` del backend.
 */
export const planUpgradeContext = {
  /**
   * Registra sólo si el código está en la lista de triggers de conversión.
   * `blockModule` se almacena junto al código (puede ser `null` si no aplica o
   * si el backend todavía no lo envía: en ambos casos funciona el flujo).
   */
  record(code: string | null | undefined, blockModule: string | null | undefined = null): void {
    if (!code) return;
    if (!CONVERSION_TRIGGER_CODES.has(code)) return;
    _trigger.set({
      blockCode: code,
      blockModule: typeof blockModule === 'string' && blockModule.trim().length > 0
        ? blockModule.trim()
        : null
    });
  },

  /** Devuelve el último trigger y limpia el slot (one-shot). */
  consume(): PlanUpgradeTrigger | null {
    const v = _trigger();
    if (v !== null) _trigger.set(null);
    return v;
  },

  /** Para tests unitarios o cambios de sesión (logout). */
  reset(): void {
    _trigger.set(null);
  }
};
