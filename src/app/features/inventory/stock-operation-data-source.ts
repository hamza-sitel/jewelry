import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type { CreateStockOperationRequest } from './stock-operation.dto';
import type { StockOperationResponse } from './stock-operation.model';

/**
 * Application boundary for stock operations.
 * `create` represents one stock-operation command/endpoint. The mock performs
 * the local product + history changes; a future API source will POST one request
 * to Spring Boot, where the database transaction will be authoritative.
 */
export interface StockOperationDataSource {
  getAll(): Observable<StockOperationResponse[]>;

  getByProduct(productId: number): Observable<StockOperationResponse[]>;

  create(request: CreateStockOperationRequest): Observable<StockOperationResponse>;
}

export const STOCK_OPERATION_DATA_SOURCE =
  new InjectionToken<StockOperationDataSource>('STOCK_OPERATION_DATA_SOURCE');
