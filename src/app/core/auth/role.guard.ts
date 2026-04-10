import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as string[] | undefined;
  const role = auth.role();
  if (!allowed?.length) return true;
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree(['/app']);
};
