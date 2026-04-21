import { HttpErrorResponse } from '@angular/common/http';
import type { WritableSignal } from '@angular/core';
import { planUpgradeContext } from '../services/plan-upgrade-context';

const MSG_403_PERMISOS =
  'No tiene permisos para esta operaci?n con su rol actual. Si cree que es un error, contacte al administrador.';

const MSG_401_SESION =
  'Sesi?n no v?lida o expirada. Cierre sesi?n e inicie de nuevo (si el servidor cambi? la clave JWT, necesitar? un nuevo inicio de sesi?n).';

/** Coincide con PlanBlockCodes en backend (ProblemDetail property blockCode). */
const PLAN_CAMBIO_PENDIENTE_PAGO = 'PLAN_CAMBIO_PENDIENTE_PAGO';
const PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA = 'PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA';

export interface PlanBlockFollowup {
  linkLabel: string;
}

export interface PlanBlockUx {
  message: string;
  blockCode: string | null;
  /**
   * C?digo t?cnico del m?dulo afectado cuando el backend lo transporta
   * (p. ej. `transferencias`, `reportes_basicos`). `null` si no aplica o si el
   * backend todav?a no lo env?a.
   */
  blockModule: string | null;
  showPlanSectionLink: boolean;
  linkLabel: string;
}

function detailFromProblemBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const d = o['detail'];
  if (typeof d === 'string' && d.trim().length > 0) return d;
  const m = o['message'];
  if (typeof m === 'string' && m.trim().length > 0) return m;
  return null;
}

/**
 * C?digo de bloqueo por plan en cuerpo Problem Details (propiedad {@code blockCode}).
 */
export function getApiBlockCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body = err.error;
  if (!body || typeof body !== 'object') return null;
  const bc = (body as Record<string, unknown>)['blockCode'];
  if (typeof bc === 'string' && bc.trim().length > 0) return bc.trim();
  return null;
}

/**
 * C?digo t?cnico del m?dulo afectado en cuerpo Problem Details (propiedad
 * {@code blockModule}). El backend s?lo lo env?a junto a {@code PLAN_MODULO_NO_INCLUIDO}
 * o {@code PLAN_REPORTES_NO_INCLUIDO}; en el resto devuelve {@code null}.
 */
export function getApiBlockModule(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body = err.error;
  if (!body || typeof body !== 'object') return null;
  const bm = (body as Record<string, unknown>)['blockModule'];
  if (typeof bm === 'string' && bm.trim().length > 0) return bm.trim();
  return null;
}

/**
 * Código de aplicación en Problem Details (propiedad {@code code}), distinto de {@code blockCode} (planes/MFA).
 */
export function getApiApplicationErrorCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body = err.error;
  if (!body || typeof body !== 'object') return null;
  const c = (body as Record<string, unknown>)['code'];
  if (typeof c === 'string' && c.trim().length > 0) return c.trim();
  return null;
}

/**
 * Mensaje + CTA hacia Mi empresa cuando el backend indica bloqueo por plan o l?mite.
 * Solo los c?digos con prefijo PLAN_ activan CTA de upgrade; ROL_*, TENANT_*, SUB_* llevan mensaje en detail/blockCode pero sin CTA de plan.
 * @param includeFollowup en pantallas ya ubicadas en Mi empresa, usar false.
 */
export function resolvePlanBlockUx(err: unknown, includeFollowup = true): PlanBlockUx {
  const message = getApiErrorMessage(err);
  const blockCode = getApiBlockCode(err);
  const blockModule = getApiBlockModule(err);
  if (!includeFollowup || !blockCode || !blockCode.startsWith('PLAN_')) {
    return { message, blockCode, blockModule, showPlanSectionLink: false, linkLabel: '' };
  }
  let linkLabel = 'Revisa o actualiza tu plan en Mi empresa';
  if (blockCode === PLAN_CAMBIO_PENDIENTE_PAGO) {
    linkLabel = 'Ver estado de tu cambio de plan en Mi empresa';
  } else if (blockCode === PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA) {
    linkLabel = 'Revisar suscripci?n en Mi empresa';
  }
  return { message, blockCode, blockModule, showPlanSectionLink: true, linkLabel };
}

/**
 * Asigna mensaje de error y CTA opcional a signals de p?gina.
 */
export function patchPlanErrorSignals(
  err: unknown,
  message: WritableSignal<string | null>,
  followup: WritableSignal<PlanBlockFollowup | null>
): void {
  const ux = resolvePlanBlockUx(err);
  message.set(ux.message);
  followup.set(ux.showPlanSectionLink ? { linkLabel: ux.linkLabel } : null);
  // Registra s?lo c?digos de conversi?n (ver plan-upgrade-context.ts).
  // Sin acoplar p?ginas: mismo punto que ya procesan las 17 features hoy.
  // El m?dulo exacto (si el backend lo env?a) viaja junto al c?digo para que
  // MiEmpresaPage recomiende con precisi?n.
  planUpgradeContext.record(ux.blockCode, ux.blockModule);
}

/**
 * Mensaje legible para errores HTTP del API (Problem Details RFC 7807 / Spring).
 */
export function getApiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    const fromProblem = detailFromProblemBody(body);
    if (fromProblem) return fromProblem;
    if (typeof body === 'string' && body.length > 0) return body;
    if (err.status === 403) {
      return MSG_403_PERMISOS;
    }
    if (err.status === 401) {
      return MSG_401_SESION;
    }
    if (err.status === 400) {
      return 'Solicitud no v?lida. Revise los datos enviados.';
    }
    if (err.status === 409) {
      return 'El recurso ya existe o está en conflicto con datos existentes.';
    }
    return err.message || `Error HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
