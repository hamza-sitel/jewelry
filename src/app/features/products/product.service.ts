import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './product.model';

import { PRODUCT_DATA_SOURCE } from './product-data-source';
import type { ProductDataSource } from './product-data-source';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    @Inject(PRODUCT_DATA_SOURCE)
    private readonly dataSource: ProductDataSource,
  ) {}

  getProducts(): Observable<ProductResponse[]> {
    return this.dataSource.getAll();
  }

  getProductById(id: number): Observable<ProductResponse | undefined> {
    return this.dataSource.getById(id);
  }

  createProduct(
    request: CreateProductRequest,
  ): Observable<ProductResponse> {
    return this.dataSource.create(request);
  }

  updateProduct(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined> {
    return this.dataSource.update(id, request);
  }
}