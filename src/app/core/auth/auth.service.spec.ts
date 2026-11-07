import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AUTH_DATA_SOURCE } from './auth-data-source';
import type { AuthDataSource } from './auth-data-source';
import type { UserResponse } from './auth.model';
import { AuthService } from './auth.service';

const admin: UserResponse = { id: 1, username: 'admin', displayName: 'Store Admin', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-11-01T10:00:00.000Z' };

describe('AuthService', () => {
  let service: AuthService;
  let source: AuthDataSource;

  beforeEach(() => {
    source = {
      getCurrentUser: () => admin,
      restoreSession: async () => admin,
      login: async () => admin,
      logout: () => undefined,
      getEmployees: async () => [],
      createEmployee: async request => ({ id: 2, username: request.username, displayName: request.displayName, role: 'EMPLOYEE', status: 'ACTIVE', createdAt: '2026-11-01T10:00:00.000Z' }),
      setEmployeeStatus: async (_id, status) => ({ ...admin, id: 2, role: 'EMPLOYEE', status }),
      changePassword: async () => undefined,
    };
    TestBed.configureTestingModule({ providers: [AuthService, { provide: AUTH_DATA_SOURCE, useValue: source }] });
    service = TestBed.inject(AuthService);
  });

  it('exposes the current user and admin role', () => {
    expect(service.currentUser?.username).toBe('admin');
    expect(service.isAdmin).toBe(true);
  });

  it('delegates login to the configured data source', async () => {
    const result = await firstValueFrom(service.login({ username: 'admin', password: 'secret' }));
    expect(result.role).toBe('ADMIN');
  });

  it('creates employee accounts through the data source', async () => {
    const result = await firstValueFrom(service.createEmployee({ username: 'sara', displayName: 'Sara', password: 'Password123' }));
    expect(result.role).toBe('EMPLOYEE');
    expect(result.username).toBe('sara');
  });
});
