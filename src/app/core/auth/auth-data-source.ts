import { InjectionToken } from '@angular/core';

import type {
  ChangePasswordRequest,
  CreateEmployeeRequest,
  LoginRequest,
  UserResponse,
  UserStatus,
} from './auth.model';

/** Boundary between authentication workflows and their storage/API implementation. */
export interface AuthDataSource {
  getCurrentUser(): UserResponse | null;
  login(request: LoginRequest): Promise<UserResponse>;
  logout(): void;
  getEmployees(): UserResponse[];
  createEmployee(request: CreateEmployeeRequest): Promise<UserResponse>;
  setEmployeeStatus(id: number, status: UserStatus): Promise<UserResponse>;
  changePassword(request: ChangePasswordRequest): Promise<void>;
}

export const AUTH_DATA_SOURCE = new InjectionToken<AuthDataSource>('AUTH_DATA_SOURCE');
