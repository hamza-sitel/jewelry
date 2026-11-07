import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { normalizeApiError } from './api-request-error';

/** Convert backend/transport failures into one predictable frontend error type. */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError(error => throwError(() => normalizeApiError(error))),
  );
