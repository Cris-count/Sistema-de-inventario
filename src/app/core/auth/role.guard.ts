import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROLE_CODE_VENTAS } from '../navigation';
import { AuthService } from './auth.service';
import { setRouteForbiddenFlash } from '../util/access-flash';

/**
 * Comprueba `data.roles` frente al rol actual (sincronizado vía syncUserGuard + `/auth/me`).
 * Si no hay permiso: flash en sessionStorage y vuelta al panel sin dejar una URL prohibida cargada.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as string[] | undefined;
  const role = auth.role();
  if (!allowed?.length) return true;
  if (role && allowed.includes(role)) return true;
  setRouteForbiddenFlash();
  const fallback = role === ROLE_CODE_VENTAS ? '/app/ventas' : '/app/dashboard';
  return router.createUrlTree([fallback]);
};
