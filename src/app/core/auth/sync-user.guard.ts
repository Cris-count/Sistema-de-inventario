import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Alinea rol y datos de usuario con el servidor (GET /auth/me).
 * Debe ejecutarse también al navegar entre rutas hijas de `/app` vía
 * {@code runGuardsAndResolvers: 'always'} en la ruta {@code app}, no solo al entrar la primera vez.
 * Así la UI no usa un rol cacheado distinto del que aplica Spring Security (JWT + BD).
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
