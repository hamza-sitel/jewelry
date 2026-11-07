import { InjectionToken } from '@angular/core';

/** Base URL for the Spring Boot REST API, including its `/api` prefix. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080/api',
});

export function apiEndpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
