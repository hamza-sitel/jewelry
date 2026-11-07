import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL, apiEndpoint } from '../api/api.config';
import { ApiAuthSessionStore } from './api-auth-session.store';
import type {
  AuthSessionResponse,
  ChangePasswordRequest,
  CreateEmployeeRequest,
  LoginRequest,
  UpdateEmployeeStatusRequest,
  UserResponse,
  UserStatus,
} from './auth.model';
import type { AuthDataSource } from './auth-data-source';

/** Spring Boot implementation of the authentication data-source contract. */
@Injectable()
export class ApiAuthDataSource implements AuthDataSource {
  private readonly http = inject(HttpClient);
  private readonly session = inject(ApiAuthSessionStore);

  constructor(@Inject(API_BASE_URL) private readonly baseUrl: string) {}

  getCurrentUser(): UserResponse | null {
    return this.session.currentUser;
  }

  async restoreSession(): Promise<UserResponse | null> {
    try {
      const session = await firstValueFrom(
        this.http.post<AuthSessionResponse>(apiEndpoint(this.baseUrl, 'auth/refresh'), {}),
      );
      this.applySession(session);
      return session.user;
    } catch (error) {
      // An absent/expired refresh cookie means the visitor is simply signed out.
      if (hasStatus(error, 401) || hasStatus(error, 403)) {
        this.session.clear();
        return null;
      }
      throw error;
    }
  }

  async login(request: LoginRequest): Promise<UserResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthSessionResponse>(apiEndpoint(this.baseUrl, 'auth/login'), request),
    );
    this.applySession(response);
    return response.user;
  }

  logout(): void {
    // Clear the UI immediately. The refresh cookie is revoked by the API endpoint.
    this.session.clear();
    void firstValueFrom(
      this.http.post<void>(apiEndpoint(this.baseUrl, 'auth/logout'), {}),
    ).catch(() => undefined);
  }

  getEmployees(): Promise<UserResponse[]> {
    return firstValueFrom(this.http.get<UserResponse[]>(apiEndpoint(this.baseUrl, 'employees')));
  }

  createEmployee(request: CreateEmployeeRequest): Promise<UserResponse> {
    return firstValueFrom(
      this.http.post<UserResponse>(apiEndpoint(this.baseUrl, 'employees'), request),
    );
  }

  setEmployeeStatus(id: number, status: UserStatus): Promise<UserResponse> {
    const request: UpdateEmployeeStatusRequest = { status };
    return firstValueFrom(
      this.http.patch<UserResponse>(apiEndpoint(this.baseUrl, `employees/${id}/status`), request),
    );
  }

  changePassword(request: ChangePasswordRequest): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(apiEndpoint(this.baseUrl, 'auth/password'), request),
    );
  }

  private applySession(response: AuthSessionResponse): void {
    if (!response?.accessToken || !response.user) {
      throw new Error('The authentication API returned an invalid session response.');
    }
    this.session.setSession(response.accessToken, response.user);
  }
}

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === status;
}
