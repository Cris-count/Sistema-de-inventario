import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROLE_CODE_VENTAS } from '../navigation';
import { AuthService } from './auth.service';

/** Evita que VENTAS use el panel genérico si llega por URL marcada o favoritos. */
export const ventasSkipGenericDashboardGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() === ROLE_CODE_VENTAS) {
    return router.parseUrl('/app/ventas');
  }
  return true;
};
