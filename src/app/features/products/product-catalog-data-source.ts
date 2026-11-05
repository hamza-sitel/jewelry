import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  CreateCategoryRequest,
  CreateProductTypeRequest,
  ProductCatalogSnapshot,
  ProductCategoryResponse,
  ProductTypeResponse,
  UpdateCategoryRequest,
  UpdateProductTypeRequest,
} from './product.model';

/** Persistence boundary for category and product-type catalog data. */
export interface ProductCatalogDataSource {
  getCatalog(): Observable<ProductCatalogSnapshot>;

  createCategory(request: CreateCategoryRequest): Observable<ProductCategoryResponse>;

  updateCategory(
    id: number,
    request: UpdateCategoryRequest,
  ): Observable<ProductCategoryResponse | undefined>;

  createType(request: CreateProductTypeRequest): Observable<ProductTypeResponse>;

  updateType(
    id: number,
    request: UpdateProductTypeRequest,
  ): Observable<ProductTypeResponse | undefined>;
}

export const PRODUCT_CATALOG_DATA_SOURCE =
  new InjectionToken<ProductCatalogDataSource>('PRODUCT_CATALOG_DATA_SOURCE');
