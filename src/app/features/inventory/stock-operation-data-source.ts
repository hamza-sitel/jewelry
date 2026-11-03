
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type { StockOperation } from './stock-operation.model';

export interface StockOperationDataSource {
  getAll(): Observable<StockOperation[]>;

  getByProduct(productId: number): Observable<StockOperation[]>;

  create(
    operation: Omit<StockOperation, 'id'>,
  ): Observable<StockOperation>;
}

export const STOCK_OPERATION_DATA_SOURCE =
  new InjectionToken<StockOperationDataSource>(
    'STOCK_OPERATION_DATA_SOURCE',
  );
