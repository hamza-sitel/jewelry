import { HttpBackend, HttpClient } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';

import { API_BASE_URL, apiEndpoint } from '../api/api.config';
import { ApiAuthSessionStore } from './api-auth-session.store';
import type { AuthSessionResponse } from './auth.model';

/** Shares one refresh request when several API calls receive 401 at the same time. */
@Injectable({ providedIn: 'root' })
export class ApiAuthRefreshService {
  private readonly rawHttp: HttpClient;
  private readonly session = inject(ApiAuthSessionStore);
  private refreshInFlight$: Observable<AuthSessionResponse> | null = null;

  constructor(
    backend: HttpBackend,
    @Inject(API_BASE_URL) private readonly baseUrl: string,
  ) {
    // Bypass interceptors so refreshing cannot recursively trigger another refresh.
    this.rawHttp = new HttpClient(backend);
  }

  refresh(): Observable<AuthSessionResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.rawHttp
        .post<AuthSessionResponse>(apiEndpoint(this.baseUrl, 'auth/refresh'), {}, {
          withCredentials: true,
        })
        .pipe(
          tap(response => {
            if (!response?.accessToken || !response.user) {
              throw new Error('The refresh endpoint returned an invalid session response.');
            }
            this.session.setSession(response.accessToken, response.user);
          }),
          finalize(() => { this.refreshInFlight$ = null; }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }

    return this.refreshInFlight$;
  }
}
