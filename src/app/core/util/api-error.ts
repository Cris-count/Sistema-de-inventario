import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'detail' in body && typeof (body as { detail: string }).detail === 'string') {
      return (body as { detail: string }).detail;
    }
    if (typeof body === 'string' && body.length > 0) return body;
    if (err.status === 403) {
      return 'Acceso denegado. Si debería poder ver esto, cierre sesión y vuelva a entrar (el token puede haber expirado o el servidor se reinició con otra clave JWT).';
    }
    if (err.status === 401) {
      return 'No autorizado. Verifique usuario y contraseña o inicie sesión de nuevo.';
    }
    return err.message || `Error HTTP ${err.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
