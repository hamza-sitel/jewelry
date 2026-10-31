
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { ProductService } from '../../products/product.service';
import type { ProductResponse } from '../../products/product.model';

import type {
  StockOperation,
  StockOperationType,
} from '../stock-operation.model';

@Injectable({
  providedIn: 'root',
})
export class StockOperationService {
  private readonly productService = inject(ProductService);

  private operations: StockOperation[] = [];
  private nextOperationId = 1;

  getOperations(): Observable<StockOperation[]> {
    return of([...this.operations]);
  }

  getOperationsByProduct(
    productId: number,
  ): Observable<StockOperation[]> {
    const productOperations = this.operations.filter(
      operation => operation.productId === productId,
    );

    return of([...productOperations]);
  }

  createOperation(
    productId: number,
    type: StockOperationType,
    quantity: number,
    notes: string | null = null,
  ): Observable<StockOperation> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return throwError(
        () => new Error('Quantity must be a positive whole number.'),
      );
    }

    return new Observable<StockOperation>(subscriber => {
      this.productService.getProductById(productId).subscribe({
        next: product => {
          if (!product) {
            subscriber.error(new Error('Product not found.'));
            return;
          }

          const newStock = this.calculateNewStock(
            product,
            type,
            quantity,
          );

          if (newStock < 0) {
            subscriber.error(
              new Error('Insufficient stock for this operation.'),
            );
            return;
          }

          this.productService
            .updateProduct(productId, {
              name: product.name,
              categoryId: product.categoryId,
              typeId: product.typeId,
              trackingMode: product.trackingMode,
              weight: product.weight,
              quantity: newStock,
              purchasePrice: product.purchasePrice,
              salePrice: product.salePrice,
              imageUrl: product.imageUrl,
            })
            .subscribe({
              next: updatedProduct => {
                if (!updatedProduct) {
                  subscriber.error(
                    new Error('Unable to update product stock.'),
                  );
                  return;
                }

                const operation: StockOperation = {
                  id: this.nextOperationId++,
                  productId: product.id,
                  productName: product.name,
                  barcode: product.barcode,
                  type,
                  quantity,
                  previousStock: product.quantity,
                  newStock,
                  createdAt: new Date().toISOString(),
                  notes,
                };

                this.operations.unshift(operation);

                subscriber.next(operation);
                subscriber.complete();
              },
              error: error => subscriber.error(error),
            });
        },
        error: error => subscriber.error(error),
      });
    });
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
