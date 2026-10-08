import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const HttpAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const storedSession = sessionStorage.getItem('casino-auth-session');
  if (!storedSession) {
    return next(request);
  }

  try {
    const session = JSON.parse(storedSession) as { token?: string };
    if (session.token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${session.token}` },
      });
    }
  } catch {
    sessionStorage.removeItem('casino-auth-session');
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.expireSession();
      }

      return throwError(() => error);
    }),
  );
};
