import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Alinea rol y datos de usuario con el servidor antes de mostrar el shell.
 * Evita que la UI (p. ej. botón «Nuevo producto») use un rol cacheado en localStorage
 * distinto del que aplica Spring Security tras {@link JwtAuthenticationFilter}.
 */
export const syncUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.refreshMe().pipe(
    map(() => true),
    catchError(() => {
      auth.clearSession();
      return of(router.createUrlTree(['/login']));
    })
  );
};
