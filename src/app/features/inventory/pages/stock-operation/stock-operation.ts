
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ProductService } from '../../../products/product.service';
import type { ProductResponse } from '../../../products/product.model';

import type {
  StockOperation,
  StockOperationType,
} from '../../stock-operation.model';

@Injectable({
  providedIn: 'root',
})
export class StockOperationService {
  private readonly productService = inject(ProductService);

  private operations: StockOperation[] = [];
  private nextOperationId = 1;

  // Return all stock operations.
  getOperations(): Observable<StockOperation[]> {
    return of([...this.operations]);
  }

  // Return operations belonging to one product.
  getOperationsByProduct(
    productId: number,
  ): Observable<StockOperation[]> {
    const productOperations = this.operations.filter(
      operation => operation.productId === productId,
    );

    return of([...productOperations]);
  }

  // Create a stock operation and update product quantity.
  createOperation(
    productId: number,
    type: StockOperationType,
    quantity: number,
    notes: string | null = null,
  ): Observable<StockOperation> {
    // Validate quantity.
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return throwError(
        () => new Error('Quantity must be a positive whole number.'),
      );
    }

    // Find the product first.
    return this.productService.getProductById(productId).pipe(
      switchMap(product => {
        if (!product) {
          return throwError(
            () => new Error('Product not found.'),
          );
        }

        // Calculate the new stock.
        const newStock = this.calculateNewStock(
          product,
          type,
          quantity,
        );

        // Prevent negative stock.
        if (newStock < 0) {
          return throwError(
            () => new Error('Insufficient stock for this operation.'),
          );
        }

        // Update the product quantity.
        return this.productService.updateProduct(productId, {
          name: product.name,
          categoryId: product.categoryId,
          typeId: product.typeId,
          trackingMode: product.trackingMode,
          weight: product.weight,
          quantity: newStock,
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          imageUrl: product.imageUrl,
        }).pipe(
          switchMap(updatedProduct => {
            if (!updatedProduct) {
              return throwError(
                () => new Error('Unable to update product stock.'),
              );
            }

            // Create the history record only after the update succeeds.
            const operation: StockOperation = {
              id: this.nextOperationId++,
              productId: updatedProduct.id,
              productName: updatedProduct.name,
              barcode: updatedProduct.barcode,
              type,
              quantity,
              previousStock: product.quantity,
              newStock: updatedProduct.quantity,
              createdAt: new Date().toISOString(),
              notes,
            };

            this.operations.unshift(operation);

            return of(operation);
          }),
        );
      }),
    );
  }

  // Calculate stock according to operation type.
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
