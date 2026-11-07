import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api.config';
import { ApiAuthSessionStore } from './api-auth-session.store';
import { ApiAuthDataSource } from './api-auth-data-source';
import type { AuthSessionResponse, UserResponse } from './auth.model';

describe('ApiAuthDataSource', () => {
  let source: ApiAuthDataSource;
  let http: HttpTestingController;
  let sessionStore: ApiAuthSessionStore;

  const admin: UserResponse = {
    id: 1, username: 'admin', displayName: 'Store Administrator', role: 'ADMIN',
    status: 'ACTIVE', createdAt: '2026-11-07T10:00:00.000Z',
  };
  const session: AuthSessionResponse = { accessToken: 'short-lived-access-token', user: admin };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        ApiAuthSessionStore, ApiAuthDataSource,
      ],
    });
    source = TestBed.inject(ApiAuthDataSource);
    http = TestBed.inject(HttpTestingController);
    sessionStore = TestBed.inject(ApiAuthSessionStore);
  });

  afterEach(() => http.verify());

  it('restores the session from the refresh-cookie endpoint', async () => {
    const resultPromise = source.restoreSession();
    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    request.flush(session);

    await expect(resultPromise).resolves.toEqual(admin);
    expect(source.getCurrentUser()).toEqual(admin);
    expect(sessionStore.token).toBe('short-lived-access-token');
  });

  it('treats an expired refresh cookie as a signed-out session', async () => {
    const resultPromise = source.restoreSession();
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    await expect(resultPromise).resolves.toBeNull();
    expect(source.getCurrentUser()).toBeNull();
  });

  it('sends login credentials and stores the short-lived session in memory', async () => {
    const resultPromise = source.login({ username: 'admin', password: 'secret' });
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'admin', password: 'secret' });
    request.flush(session);

    await expect(resultPromise).resolves.toEqual(admin);
    expect(sessionStore.token).toBe('short-lived-access-token');
  });
});
