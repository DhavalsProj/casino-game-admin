import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Routes without an explicit role list remain available to existing admin/user
  // accounts, while agents must be explicitly allowed into each feature.
  const allowedRoles = (route.data['roles'] as UserRole[] | undefined)
    ?? (authService.role === 'agent' ? ['superadmin', 'admin'] : undefined);
  if (allowedRoles && !allowedRoles.includes(authService.role!)) {
    return router.createUrlTree(['/']);
  }

  return true;
};
