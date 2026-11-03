
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class BrowserStorageService {
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) {
      return fallback;
    }

    try {
      const storedValue = localStorage.getItem(key);

      if (storedValue === null) {
        return fallback;
      }

      return JSON.parse(storedValue) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error(
        `Unable to save "${key}" in browser storage.`,
      );
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(key);
  }
}
