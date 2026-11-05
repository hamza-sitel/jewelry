import { Inject, Injectable } from '@angular/core';
import { from, of } from 'rxjs';

import { AUTH_DATA_SOURCE } from './auth-data-source';
import type { AuthDataSource } from './auth-data-source';
import type {
  ChangePasswordRequest,
  CreateEmployeeRequest,
  LoginRequest,
  UserResponse,
  UserStatus,
} from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    @Inject(AUTH_DATA_SOURCE) private readonly dataSource: AuthDataSource,
  ) {}

  get currentUser(): UserResponse | null {
    return this.dataSource.getCurrentUser();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  login(request: LoginRequest) {
    return from(this.dataSource.login(request));
  }

  logout(): void {
    this.dataSource.logout();
  }

  getEmployees() {
    return of(this.dataSource.getEmployees());
  }

  createEmployee(request: CreateEmployeeRequest) {
    return from(this.dataSource.createEmployee(request));
  }

  setEmployeeStatus(id: number, status: UserStatus) {
    return from(this.dataSource.setEmployeeStatus(id, status));
  }

  changePassword(request: ChangePasswordRequest) {
    return from(this.dataSource.changePassword(request));
  }
}
