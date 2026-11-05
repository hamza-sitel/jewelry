import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import type { CreateStockOperationRequest } from '../stock-operation.dto';
import { STOCK_OPERATION_DATA_SOURCE } from '../stock-operation-data-source';
import type { StockOperationDataSource } from '../stock-operation-data-source';
import type { StockOperationResponse } from '../stock-operation.model';

const VALID_OPERATION_TYPES = [
  'PURCHASE',
  'SALE',
  'MANUAL_ADD',
  'MANUAL_REMOVE',
] as const;

@Injectable({ providedIn: 'root' })
export class StockOperationService {
  private readonly dataSource: StockOperationDataSource = inject(
    STOCK_OPERATION_DATA_SOURCE,
  );

  getOperations(): Observable<StockOperationResponse[]> {
    return this.dataSource.getAll();
  }

  getOperationsByProduct(
    productId: number,
  ): Observable<StockOperationResponse[]> {
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return throwError(() => new Error('A valid product ID is required.'));
    }

    return this.dataSource.getByProduct(productId);
  }

  /**
   * Validates the shape of the command, then delegates the operation.
   * The mock/API data source is responsible for checking current product stock.
   */
  createOperation(
    request: CreateStockOperationRequest,
  ): Observable<StockOperationResponse> {
    const validationError = this.validateRequest(request);

    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const normalizedRequest: CreateStockOperationRequest = {
      ...request,
      notes: request.notes?.trim() || null,
    };

    return this.dataSource.create(normalizedRequest);
  }

  private validateRequest(
    request: CreateStockOperationRequest,
  ): string | null {
    if (!request || typeof request !== 'object') {
      return 'A stock operation request is required.';
    }

    if (!Number.isSafeInteger(request.productId) || request.productId <= 0) {
      return 'Select a valid product.';
    }

    if (!VALID_OPERATION_TYPES.includes(request.type)) {
      return 'Select a valid stock operation type.';
    }

    if (!Number.isSafeInteger(request.quantity) || request.quantity <= 0) {
      return 'Quantity must be a positive whole number.';
    }

    if (request.notes !== null && typeof request.notes !== 'string') {
      return 'Notes must be text or empty.';
    }

    if (typeof request.notes === 'string' && request.notes.length > 500) {
      return 'Notes cannot exceed 500 characters.';
    }

    return null;
  }
}
