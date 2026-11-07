import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { apiAuthInterceptor } from './api-auth.interceptor';
import { apiErrorInterceptor } from './api-error.interceptor';
import { ApiAuthSessionStore } from '../auth/api-auth-session.store';
import type { AuthSessionResponse, UserResponse } from '../auth/auth.model';

describe('apiAuthInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let session: ApiAuthSessionStore;

  const user: UserResponse = {
    id: 1, username: 'admin', displayName: 'Administrator', role: 'ADMIN',
    status: 'ACTIVE', createdAt: '2026-11-07T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiAuthInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        ApiAuthSessionStore,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    session = TestBed.inject(ApiAuthSessionStore);
    session.setSession('expired-access-token', user);
  });

  afterEach(() => http.verify());

  it('refreshes once after an expired access token and retries the original request', async () => {
    const responsePromise = firstValueFrom(client.get<{ ready: boolean }>('/api/private'));

    const firstRequest = http.expectOne('/api/private');
    expect(firstRequest.request.headers.get('Authorization')).toBe('Bearer expired-access-token');
    expect(firstRequest.request.withCredentials).toBe(true);
    firstRequest.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    const refreshedSession: AuthSessionResponse = { accessToken: 'new-access-token', user };
    const refreshRequest = http.expectOne('/api/auth/refresh');
    expect(refreshRequest.request.method).toBe('POST');
    expect(refreshRequest.request.withCredentials).toBe(true);
    refreshRequest.flush(refreshedSession);

    const retryRequest = http.expectOne('/api/private');
    expect(retryRequest.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retryRequest.flush({ ready: true });

    await expect(responsePromise).resolves.toEqual({ ready: true });
    expect(session.token).toBe('new-access-token');
  });
  it('shares one refresh request for concurrent expired API calls', async () => {
    const responsePromise = firstValueFrom(forkJoin([
      client.get<{ id: number }>('/api/first'),
      client.get<{ id: number }>('/api/second'),
    ]));

    http.expectOne('/api/first').flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/second').flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshedSession: AuthSessionResponse = { accessToken: 'shared-new-token', user };
    const refreshRequest = http.expectOne('/api/auth/refresh');
    refreshRequest.flush(refreshedSession);

    http.expectOne('/api/first').flush({ id: 1 });
    http.expectOne('/api/second').flush({ id: 2 });

    await expect(responsePromise).resolves.toEqual([{ id: 1 }, { id: 2 }]);
    expect(session.token).toBe('shared-new-token');
  });

});
