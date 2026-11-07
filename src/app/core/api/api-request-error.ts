import { HttpErrorResponse } from '@angular/common/http';

import type { ApiErrorResponse } from '../models/api-error.model';

/** Normalized error exposed by the HTTP boundary to existing page components. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
    readonly path: string | null = null,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function normalizeApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;

  if (error instanceof HttpErrorResponse) {
    const body = isApiErrorResponse(error.error) ? error.error : null;
    const message = body?.message || fallbackMessage(error);
    return new ApiRequestError(
      message,
      error.status,
      body?.fieldErrors ?? {},
      body?.path ?? null,
    );
  }

  return new ApiRequestError(
    error instanceof Error ? error.message : 'An unexpected API error occurred.',
    0,
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Unable to reach the server. Check your connection and API URL.';
  if (error.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission to perform this action.';
  if (error.status === 404) return 'The requested record was not found.';
  if (error.status === 409) return 'This operation conflicts with the current server data.';
  if (error.status >= 500) return 'The server could not complete the request. Please try again.';
  return error.message || 'The request could not be completed.';
}
