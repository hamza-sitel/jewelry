import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';

import { ProductService } from '../../products/product.service';
import type { ProductResponse } from '../../products/product.model';
import { STOCK_OPERATION_DATA_SOURCE } from '../stock-operation-data-source';
import type { StockOperationDataSource } from '../stock-operation-data-source';
import type {
  StockOperation,
  StockOperationType,
} from '../stock-operation.model';

@Injectable({ providedIn: 'root' })
export class StockOperationService {
  private readonly productService = inject(ProductService);
  private readonly dataSource: StockOperationDataSource = inject(
    STOCK_OPERATION_DATA_SOURCE,
  );

  getOperations(): Observable<StockOperation[]> {
    return this.dataSource.getAll();
  }

  getOperationsByProduct(productId: number): Observable<StockOperation[]> {
    return this.dataSource.getByProduct(productId);
  }

  createOperation(
    productId: number,
    type: StockOperationType,
    quantity: number,
    notes: string | null = null,
  ): Observable<StockOperation> {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      return throwError(
        () => new Error('Quantity must be a positive whole number.'),
      );
    }

    return this.productService.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          return throwError(() => new Error('Product not found.'));
        }

        if (product.status === 'ARCHIVED') {
          return throwError(
            () =>
              new Error(
                'This product is archived. Restore it before performing stock operations.',
              ),
          );
        }

        const newStock = this.calculateNewStock(product, type, quantity);

        if (newStock < 0) {
          return throwError(
            () => new Error('Insufficient stock for this operation.'),
          );
        }

        return this.productService.updateStockQuantity(productId, newStock).pipe(
          switchMap(updatedProduct => {
            if (!updatedProduct) {
              return throwError(() => new Error('Unable to update product stock.'));
            }

            // The mock implementation persists this after the stock write.
            // Phase 3 moves both writes into one Spring Boot database transaction.
            return this.dataSource.create({
              productId: product.id,
              productName: product.name,
              barcode: product.barcode,
              type,
              quantity,
              previousStock: product.quantity,
              newStock: updatedProduct.quantity,
              createdAt: new Date().toISOString(),
              notes,
            });
          }),
        );
      }),
    );
  }

  private calculateNewStock(
    product: ProductResponse,
    type: StockOperationType,
    quantity: number,
  ): number {
    switch (type) {
      case 'PURCHASE':
      case 'MANUAL_ADD':
        return product.quantity + quantity;

      case 'SALE':
      case 'MANUAL_REMOVE':
        return product.quantity - quantity;
    }
  }
}
