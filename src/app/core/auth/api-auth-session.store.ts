import { Injectable } from '@angular/core';

import type { UserResponse } from './auth.model';

/**
 * Keeps the short-lived access token in memory only. The backend should keep the
 * refresh token in a Secure, HttpOnly, SameSite cookie; never persist either token
 * in localStorage from this frontend.
 */
@Injectable({ providedIn: 'root' })
export class ApiAuthSessionStore {
  private accessToken: string | null = null;
  private user: UserResponse | null = null;

  get token(): string | null {
    return this.accessToken;
  }

  get currentUser(): UserResponse | null {
    return this.user;
  }

  setSession(accessToken: string, user: UserResponse): void {
    this.accessToken = accessToken;
    this.user = user;
  }

  clear(): void {
    this.accessToken = null;
    this.user = null;
  }
}
