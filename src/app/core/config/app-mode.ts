/**
 * Select the frontend data implementation.
 * Keep `mock` for demos and UI development. Change to `api` when the Spring Boot
 * API is available and its endpoint contract matches BACKEND-INTEGRATION-GUIDE.md.
 * There is deliberately no automatic fallback: API failures must remain visible.
 */
export type AppDataMode = 'mock' | 'api';

export const APP_DATA_MODE: AppDataMode = 'mock';
