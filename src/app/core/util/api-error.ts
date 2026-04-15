import { HttpErrorResponse } from '@angular/common/http';
import type { WritableSignal } from '@angular/core';

const MSG_403_PERMISOS =
  'No tiene permisos para esta operación con su rol actual. Si cree que es un error, contacte al administrador.';

const MSG_401_SESION =
  'Sesión no válida o expirada. Cierre sesión e inicie de nuevo (si el servidor cambió la clave JWT, necesitará un nuevo inicio de sesión).';

/** Coincide con PlanBlockCodes en backend (ProblemDetail property blockCode). */
const PLAN_CAMBIO_PENDIENTE_PAGO = 'PLAN_CAMBIO_PENDIENTE_PAGO';
const PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA = 'PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA';

export interface PlanBlockFollowup {
  linkLabel: string;
}

export interface PlanBlockUx {
  message: string;
  blockCode: string | null;
  showPlanSectionLink: boolean;
  linkLabel: string;
}

function detailFromProblemBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const d = o['detail'];
  if (typeof d === 'string' && d.trim().length > 0) return d;
  return null;
}

/**
 * Código de bloqueo por plan en cuerpo Problem Details (propiedad {@code blockCode}).
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
 * Mensaje + CTA hacia Mi empresa cuando el backend indica bloqueo por plan o límite.
 * Solo los códigos con prefijo PLAN_ activan CTA de upgrade; ROL_*, TENANT_*, SUB_* llevan mensaje en detail/blockCode pero sin CTA de plan.
 * @param includeFollowup en pantallas ya ubicadas en Mi empresa, usar false.
 */
export function resolvePlanBlockUx(err: unknown, includeFollowup = true): PlanBlockUx {
  const message = getApiErrorMessage(err);
  const blockCode = getApiBlockCode(err);
  if (!includeFollowup || !blockCode || !blockCode.startsWith('PLAN_')) {
    return { message, blockCode, showPlanSectionLink: false, linkLabel: '' };
  }
  let linkLabel = 'Revisa o actualiza tu plan en Mi empresa';
  if (blockCode === PLAN_CAMBIO_PENDIENTE_PAGO) {
    linkLabel = 'Ver estado de tu cambio de plan en Mi empresa';
  } else if (blockCode === PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA) {
    linkLabel = 'Revisar suscripción en Mi empresa';
  }
  return { message, blockCode, showPlanSectionLink: true, linkLabel };
}

/**
 * Asigna mensaje de error y CTA opcional a signals de página.
 */
export function patchPlanErrorSignals(
  err: unknown,
  message: WritableSignal<string | null>,
  followup: WritableSignal<PlanBlockFollowup | null>
): void {
  const ux = resolvePlanBlockUx(err);
  message.set(ux.message);
  followup.set(ux.showPlanSectionLink ? { linkLabel: ux.linkLabel } : null);
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
      return 'Solicitud no válida. Revise los datos enviados.';
    }
    return err.message || `Error HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
