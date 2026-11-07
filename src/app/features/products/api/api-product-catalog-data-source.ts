import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_BASE_URL, apiEndpoint } from '../../../core/api/api.config';
import type {
  CreateCategoryRequest,
  CreateProductTypeRequest,
  ProductCatalogSnapshot,
  ProductCategoryResponse,
  ProductTypeResponse,
  UpdateCategoryRequest,
  UpdateProductTypeRequest,
} from '../product.model';
import type { ProductCatalogDataSource } from '../product-catalog-data-source';

/** REST implementation for categories and category-specific product types. */
@Injectable()
export class ApiProductCatalogDataSource implements ProductCatalogDataSource {
  private readonly http = inject(HttpClient);
  private readonly catalogUrl: string;
  private readonly categoriesUrl: string;
  private readonly typesUrl: string;

  constructor(@Inject(API_BASE_URL) baseUrl: string) {
    this.catalogUrl = apiEndpoint(baseUrl, 'catalog');
    this.categoriesUrl = apiEndpoint(baseUrl, 'categories');
    this.typesUrl = apiEndpoint(baseUrl, 'product-types');
  }

  getCatalog(): Observable<ProductCatalogSnapshot> {
    return this.http.get<ProductCatalogSnapshot>(this.catalogUrl);
  }

  createCategory(request: CreateCategoryRequest): Observable<ProductCategoryResponse> {
    return this.http.post<ProductCategoryResponse>(this.categoriesUrl, request);
  }

  updateCategory(id: number, request: UpdateCategoryRequest): Observable<ProductCategoryResponse | undefined> {
    return this.http.patch<ProductCategoryResponse>(`${this.categoriesUrl}/${id}`, request).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }

  createType(request: CreateProductTypeRequest): Observable<ProductTypeResponse> {
    return this.http.post<ProductTypeResponse>(this.typesUrl, request);
  }

  updateType(id: number, request: UpdateProductTypeRequest): Observable<ProductTypeResponse | undefined> {
    return this.http.patch<ProductTypeResponse>(`${this.typesUrl}/${id}`, request).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}
