import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const HttpAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
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
        sessionStorage.removeItem('casino-auth-session');
        void router.navigate(['/signin']);
      }

      return throwError(() => error);
    }),
  );
};
