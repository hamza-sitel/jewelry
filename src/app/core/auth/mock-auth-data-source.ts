import { Injectable, inject } from '@angular/core';

import { BrowserStorageService } from '../services/browser-storage.service';
import type {
  ChangePasswordRequest,
  CreateEmployeeRequest,
  LoginRequest,
  StoredAuthUser,
  UserResponse,
  UserStatus,
} from './auth.model';
import type { AuthDataSource } from './auth-data-source';

interface StoredSession {
  userId: number;
}

/**
 * Browser-only prototype authentication. It uses salted PBKDF2 hashes rather than
 * storing readable passwords, but localStorage and client-side roles are editable
 * by the browser user. Replace this adapter with a Spring Boot API before production.
 */
@Injectable()
export class MockAuthDataSource implements AuthDataSource {
  private readonly storage = inject(BrowserStorageService);
  private readonly usersKey = 'jewelry-stock.auth-users';
  private readonly sessionKey = 'jewelry-stock.auth-session';
  private readonly iterations = 120_000;
  private initialization: Promise<void> | null = null;

  getCurrentUser(): UserResponse | null {
    const session = this.storage.get<StoredSession | null>(this.sessionKey, null);
    if (!session || !Number.isSafeInteger(session.userId)) return null;

    const user = this.readUsers().find(item => item.id === session.userId);
    return user?.status === 'ACTIVE' ? this.toResponse(user) : null;
  }

  restoreSession(): Promise<UserResponse | null> {
    return Promise.resolve(this.getCurrentUser());
  }

  async login(request: LoginRequest): Promise<UserResponse> {
    await this.ensureInitialized();
    const username = request.username.trim().toLocaleLowerCase();
    const user = this.readUsers().find(item => item.username.toLocaleLowerCase() === username);

    if (!user || !(await this.passwordMatches(request.password, user))) {
      throw new Error('Username or password is incorrect.');
    }
    if (user.status !== 'ACTIVE') {
      throw new Error('This account is disabled. Contact the administrator.');
    }

    this.storage.set<StoredSession>(this.sessionKey, { userId: user.id });
    return this.toResponse(user);
  }

  logout(): void {
    this.storage.remove(this.sessionKey);
  }

  async getEmployees(): Promise<UserResponse[]> {
    return this.readUsers()
      .filter(user => user.role === 'EMPLOYEE')
      .sort((first, second) => first.displayName.localeCompare(second.displayName))
      .map(user => this.toResponse(user));
  }

  async createEmployee(request: CreateEmployeeRequest): Promise<UserResponse> {
    await this.ensureInitialized();
    const username = request.username.trim();
    const displayName = request.displayName.trim();
    const password = request.password;

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      throw new Error('Username must be 3–30 characters and use letters, numbers, dot, dash or underscore.');
    }
    if (displayName.length < 2 || displayName.length > 60) {
      throw new Error('Display name must contain between 2 and 60 characters.');
    }
    this.validatePassword(password);

    const users = this.readUsers();
    if (users.some(user => user.username.toLocaleLowerCase() === username.toLocaleLowerCase())) {
      throw new Error('This username is already in use.');
    }

    const id = Math.max(0, ...users.map(user => user.id)) + 1;
    const passwordRecord = await this.createPasswordRecord(password);
    const employee: StoredAuthUser = {
      id,
      username,
      displayName,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...passwordRecord,
    };

    this.storage.set(this.usersKey, [...users, employee]);
    return this.toResponse(employee);
  }

  async setEmployeeStatus(id: number, status: UserStatus): Promise<UserResponse> {
    if (status !== 'ACTIVE' && status !== 'DISABLED') {
      throw new Error('Select a valid employee status.');
    }
    const users = this.readUsers();
    const index = users.findIndex(user => user.id === id && user.role === 'EMPLOYEE');
    if (index < 0) throw new Error('Employee account was not found.');

    const updated = { ...users[index], status };
    const nextUsers = [...users];
    nextUsers[index] = updated;
    this.storage.set(this.usersKey, nextUsers);
    return this.toResponse(updated);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.ensureInitialized();
    const session = this.storage.get<StoredSession | null>(this.sessionKey, null);
    if (!session) throw new Error('Sign in again before changing your password.');

    const users = this.readUsers();
    const index = users.findIndex(user => user.id === session.userId);
    if (index < 0) throw new Error('The signed-in account could not be found.');
    const current = users[index];

    if (!(await this.passwordMatches(request.currentPassword, current))) {
      throw new Error('Your current password is incorrect.');
    }
    this.validatePassword(request.newPassword);

    const updated: StoredAuthUser = {
      ...current,
      ...(await this.createPasswordRecord(request.newPassword)),
    };
    const nextUsers = [...users];
    nextUsers[index] = updated;
    this.storage.set(this.usersKey, nextUsers);
  }

  private ensureInitialized(): Promise<void> {
    if (!this.initialization) {
      this.initialization = (async () => {
        const users = this.readUsers();
        if (users.length > 0) return;

        const passwordRecord = await this.createPasswordRecord('Admin@123');
        const administrator: StoredAuthUser = {
          id: 1,
          username: 'admin',
          displayName: 'Store Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          ...passwordRecord,
        };
        this.storage.set(this.usersKey, [administrator]);
      })().catch(error => {
        this.initialization = null;
        throw error;
      });
    }
    return this.initialization;
  }

  private readUsers(): StoredAuthUser[] {
    const value = this.storage.get<StoredAuthUser[]>(this.usersKey, []);
    return Array.isArray(value) ? value : [];
  }

  private toResponse(user: StoredAuthUser): UserResponse {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  private validatePassword(password: string): void {
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      throw new Error('Password must contain between 8 and 128 characters.');
    }
  }

  private async createPasswordRecord(password: string): Promise<Pick<StoredAuthUser, 'passwordSalt' | 'passwordHash'>> {
    this.validatePassword(password);
    const salt = new Uint8Array(16);
    this.getCrypto().getRandomValues(salt);
    return {
      passwordSalt: this.toBase64(salt),
      passwordHash: await this.deriveHash(password, salt),
    };
  }

  private async passwordMatches(password: string, user: StoredAuthUser): Promise<boolean> {
    if (typeof password !== 'string') return false;
    const salt = this.fromBase64(user.passwordSalt);
    const candidate = await this.deriveHash(password, salt);
    return candidate === user.passwordHash;
  }

  private async deriveHash(password: string, salt: Uint8Array): Promise<string> {
    const cryptoApi = this.getCrypto();
    const key = await cryptoApi.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
    );
    const bits = await cryptoApi.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: this.iterations, hash: 'SHA-256' },
      key,
      256,
    );
    return this.toBase64(new Uint8Array(bits));
  }

  private getCrypto(): Crypto {
    if (!globalThis.crypto?.subtle) {
      throw new Error('Secure browser cryptography is unavailable. Open the app on localhost or HTTPS.');
    }
    return globalThis.crypto;
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
}
