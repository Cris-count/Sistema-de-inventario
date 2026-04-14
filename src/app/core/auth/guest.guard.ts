import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { isJwtExpired } from '../util/jwt-expiry';

/** Solo invitado: si hay sesión válida (token no expirado), ir al panel. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const t = auth.token();
  if (t && !isJwtExpired(t)) {
    return router.createUrlTree(['/app']);
  }
  if (t && isJwtExpired(t)) {
    auth.clearSession();
  }
  return true;
};
