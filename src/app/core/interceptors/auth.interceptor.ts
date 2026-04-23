import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { isJwtExpired } from '../util/jwt-expiry';

function sessionInvalidLogout(auth: AuthService, router: Router): void {
  auth.clearSession();
  if (!router.url.startsWith('/login')) {
    void router.navigate(['/login']);
  }
}

/**
 * Rutas permitidas sin JWT en el servidor ({@code permitAll}). No deben llevar
 * {@code Authorization} con un access token inválido: el filtro JWT intentaría
 * parsearlo y respondería 401 antes de alcanzar el controlador público.
 * Alineado con {@code SecurityConfig} del backend.
 */
function isPublicApiRequest(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/mfa/verify') ||
    u.includes('/auth/refresh') ||
    u.includes('/auth/logout') ||
    u.includes('/public/') ||
    u.includes('/onboarding/') ||
    u.includes('/billing/')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const publicReq = isPublicApiRequest(req.url);

  if (token && !publicReq && isJwtExpired(token)) {
    sessionInvalidLogout(auth, router);
    return throwError(
      () =>
        new Error('La sesión expiró o el token no es válido. Vuelva a iniciar sesión.')
    );
  }

  const withAuth =
    token && !publicReq ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

   return next(withAuth).pipe(
    catchError((err) => {
      if (err.status === 401 && !router.url.startsWith('/login')) {
        sessionInvalidLogout(auth, router);
      }
      return throwError(() => err);
    })
  );
};
