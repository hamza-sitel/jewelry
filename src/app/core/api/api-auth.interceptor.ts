import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { normalizeApiError } from './api-request-error';
import { ApiAuthRefreshService } from '../auth/api-auth-refresh.service';
import { ApiAuthSessionStore } from '../auth/api-auth-session.store';

/**
 * Attach the in-memory access token and allow the HttpOnly refresh cookie.
 * If a protected request receives 401, refresh once and retry the original request.
 */
export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(ApiAuthSessionStore);
  const router = inject(Router);
  const refreshService = inject(ApiAuthRefreshService);

  const send = (accessToken: string | null) => next(request.clone({
    withCredentials: true,
    ...(accessToken ? { setHeaders: { Authorization: `Bearer ${accessToken}` } } : {}),
  }));

  return send(session.token).pipe(
    catchError(error => {
      const normalized = normalizeApiError(error);
      if (normalized.status !== 401 || isAuthenticationEndpoint(request.url)) {
        return throwError(() => normalized);
      }

      return refreshService.refresh().pipe(
        switchMap(refreshed => send(refreshed.accessToken)),
        catchError(refreshError => {
          session.clear();
          const refreshFailure = normalizeApiError(refreshError);
          if (refreshFailure.status === 401) void router.navigate(['/login']);
          return throwError(() => refreshFailure);
        }),
      );
    }),
  );
};

function isAuthenticationEndpoint(url: string): boolean {
  return /\/auth\/(login|refresh|logout)(?:\?|$)/.test(url);
}
