export type AppRole = 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'DISABLED';

/** Safe user information returned to UI components. Password material is never exposed here. */
export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: AppRole;
  status: UserStatus;
  createdAt: string;
}

/** Login command sent to the authentication service. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** The Admin can create employee accounts only; role is assigned by the application. */
export interface CreateEmployeeRequest {
  username: string;
  displayName: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Local mock-storage record. This is not an API response model. */
export interface StoredAuthUser extends UserResponse {
  passwordSalt: string;
  passwordHash: string;
}
