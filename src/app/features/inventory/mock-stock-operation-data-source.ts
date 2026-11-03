
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import type { StockOperation } from './stock-operation.model';
import type { StockOperationDataSource } from './stock-operation-data-source';

import { BrowserStorageService } from '../../core/services/browser-storage.service';

@Injectable()
export class MockStockOperationDataSource
  implements StockOperationDataSource {

  private readonly storage = inject(BrowserStorageService);
  private readonly storageKey = 'jewelry-stock.operations';

  private operations: StockOperation[] = this.storage.get(
    this.storageKey,
    [],
  );

  getAll(): Observable<StockOperation[]> {
    return of(this.operations.map(operation => ({ ...operation })));
  }

  getByProduct(productId: number): Observable<StockOperation[]> {
    const productOperations = this.operations
      .filter(operation => operation.productId === productId)
      .map(operation => ({ ...operation }));

    return of(productOperations);
  }

  create(
    operation: Omit<StockOperation, 'id'>,
  ): Observable<StockOperation> {
    const newOperation: StockOperation = {
      ...operation,
      id: this.getNextId(),
    };

    try {
      this.operations.unshift(newOperation);
      this.storage.set(this.storageKey, this.operations);

      return of({ ...newOperation });
    } catch {
      // Do not keep an operation in memory if saving failed.
      this.operations.shift();

      return throwError(
        () => new Error('Unable to save stock-operation history.'),
      );
    }
  }

  private getNextId(): number {
    return Math.max(
      0,
      ...this.operations.map(operation => operation.id),
    ) + 1;
  }
}
