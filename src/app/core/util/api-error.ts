import { HttpErrorResponse } from '@angular/common/http';

const MSG_403_PERMISOS =
  'No tiene permisos para esta operación con su rol actual. Si cree que es un error, contacte al administrador.';

const MSG_401_SESION =
  'Sesión no válida o expirada. Cierre sesión e inicie de nuevo (si el servidor cambió la clave JWT, necesitará un nuevo inicio de sesión).';

function detailFromProblemBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const d = o['detail'];
  if (typeof d === 'string' && d.trim().length > 0) return d;
  return null;
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
