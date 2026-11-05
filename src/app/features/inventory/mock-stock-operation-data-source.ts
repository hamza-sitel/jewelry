import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable, defer, from, of } from 'rxjs';

import { BrowserStorageService } from '../../core/services/browser-storage.service';
import { ProductService } from '../products/product.service';
import type { CreateStockOperationRequest } from './stock-operation.dto';
import type { StockOperationDataSource } from './stock-operation-data-source';
import type {
  StockOperationResponse,
  StockOperationType,
} from './stock-operation.model';

@Injectable()
export class MockStockOperationDataSource implements StockOperationDataSource {
  private readonly productService = inject(ProductService);
  private readonly storage = inject(BrowserStorageService);
  private readonly storageKey = 'jewelry-stock.operations';

  private operations: StockOperationResponse[] = this.storage.get(
    this.storageKey,
    [],
  );

  getAll(): Observable<StockOperationResponse[]> {
    return of(this.sortNewestFirst(this.operations));
  }

  getByProduct(productId: number): Observable<StockOperationResponse[]> {
    const productOperations = this.operations.filter(
      operation => operation.productId === productId,
    );

    return of(this.sortNewestFirst(productOperations));
  }

  /**
   * Simulates POST /api/stock-operations.
   * It updates product quantity and saves the matching history record.
   * localStorage has no database transactions, so if history persistence fails
   * we attempt a compensating stock rollback. Spring Boot will use @Transactional.
   */
  create(
    request: CreateStockOperationRequest,
  ): Observable<StockOperationResponse> {
    return defer(() => from(this.executeCreate(request)));
  }

  private async executeCreate(
    request: CreateStockOperationRequest,
  ): Promise<StockOperationResponse> {
    const product = await firstValueFrom(
      this.productService.getProductById(request.productId),
    );

    if (!product) {
      throw new Error('Product not found.');
    }

    if (product.status === 'ARCHIVED') {
      throw new Error(
        'This product is archived. Restore it before performing stock operations.',
      );
    }

    const newStock = this.calculateNewStock(
      product.quantity,
      request.type,
      request.quantity,
    );

    if (newStock < 0) {
      throw new Error('Insufficient stock for this operation.');
    }

    const updatedProduct = await firstValueFrom(
      this.productService.updateStockQuantity(product.id, newStock),
    );

    if (!updatedProduct) {
      throw new Error('Unable to update product stock.');
    }

    const operation: StockOperationResponse = {
      id: this.getNextId(),
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      type: request.type,
      quantity: request.quantity,
      previousStock: product.quantity,
      newStock: updatedProduct.quantity,
      createdAt: new Date().toISOString(),
      notes: request.notes,
    };

    const nextOperations = [operation, ...this.operations];

    try {
      this.storage.set(this.storageKey, nextOperations);
      this.operations = nextOperations;
      return { ...operation };
    } catch {
      await this.restorePreviousStock(product.id, product.quantity);
      throw new Error(
        'Unable to save stock history. The previous stock quantity was restored; please retry.',
      );
    }
  }

  private async restorePreviousStock(
    productId: number,
    previousStock: number,
  ): Promise<void> {
    try {
      const restoredProduct = await firstValueFrom(
        this.productService.updateStockQuantity(productId, previousStock),
      );

      if (!restoredProduct) {
        throw new Error('Product was not found during rollback.');
      }
    } catch {
      throw new Error(
        'Stock history could not be saved and automatic stock rollback failed. Inspect this product before retrying.',
      );
    }
  }

  private calculateNewStock(
    currentStock: number,
    type: StockOperationType,
    quantity: number,
  ): number {
    switch (type) {
      case 'PURCHASE':
      case 'MANUAL_ADD':
        return currentStock + quantity;

      case 'SALE':
      case 'MANUAL_REMOVE':
        return currentStock - quantity;
    }
  }

  private sortNewestFirst(
    operations: StockOperationResponse[],
  ): StockOperationResponse[] {
    return operations
      .map(operation => ({ ...operation }))
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  }

  private getNextId(): number {
    return Math.max(0, ...this.operations.map(operation => operation.id)) + 1;
  }
}
