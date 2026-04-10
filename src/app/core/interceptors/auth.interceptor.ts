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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  if (token && !req.url.endsWith('/auth/login') && isJwtExpired(token)) {
    sessionInvalidLogout(auth, router);
    return throwError(
      () =>
        new Error('La sesión expiró o el token no es válido. Vuelva a iniciar sesión.')
    );
  }

  const withAuth =
    token && !req.url.endsWith('/auth/login')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

   return next(withAuth).pipe(
    catchError((err) => {
      if (err.status === 401 && !router.url.startsWith('/login')) {
        sessionInvalidLogout(auth, router);
      }
      return throwError(() => err);
    })
  );
};
