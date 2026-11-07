import { InjectionToken } from '@angular/core';

import type {
  ChangePasswordRequest,
  CreateEmployeeRequest,
  LoginRequest,
  UserResponse,
  UserStatus,
} from './auth.model';

/** Boundary between authentication workflows and mock/API implementations. */
export interface AuthDataSource {
  /** Synchronous cached user for layout display; API guards restore it before navigation. */
  getCurrentUser(): UserResponse | null;
  restoreSession(): Promise<UserResponse | null>;
  login(request: LoginRequest): Promise<UserResponse>;
  logout(): void;
  getEmployees(): Promise<UserResponse[]>;
  createEmployee(request: CreateEmployeeRequest): Promise<UserResponse>;
  setEmployeeStatus(id: number, status: UserStatus): Promise<UserResponse>;
  changePassword(request: ChangePasswordRequest): Promise<void>;
}

export const AUTH_DATA_SOURCE = new InjectionToken<AuthDataSource>('AUTH_DATA_SOURCE');
