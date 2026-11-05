import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './product.model';

/** Persistence boundary for product records. */
export interface ProductDataSource {
  getAll(): Observable<ProductResponse[]>;

  getById(id: number): Observable<ProductResponse | undefined>;

  getByBarcode(barcode: string): Observable<ProductResponse | undefined>;

  create(request: CreateProductRequest): Observable<ProductResponse>;

  /** Updates product details only. Quantity and tracking mode are immutable here. */
  update(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined>;

  /** Stock quantity is changed only through an inventory operation. */
  updateStockQuantity(
    id: number,
    quantity: number,
  ): Observable<ProductResponse | undefined>;

  archive(id: number): Observable<ProductResponse | undefined>;

  restore(id: number): Observable<ProductResponse | undefined>;
}

export const PRODUCT_DATA_SOURCE =
  new InjectionToken<ProductDataSource>('PRODUCT_DATA_SOURCE');
