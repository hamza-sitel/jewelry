import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './product.model';

export interface ProductDataSource {
  getAll(): Observable<ProductResponse[]>;

  getById(id: number): Observable<ProductResponse | undefined>;

  create(request: CreateProductRequest): Observable<ProductResponse>;

  update(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined>;
}

export const PRODUCT_DATA_SOURCE =
  new InjectionToken<ProductDataSource>('PRODUCT_DATA_SOURCE');