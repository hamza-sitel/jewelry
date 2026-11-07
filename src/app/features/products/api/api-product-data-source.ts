import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_BASE_URL, apiEndpoint } from '../../../core/api/api.config';
import type {
  CreateProductRequest,
  ProductResponse,
  SellableProductResponse,
  UpdateProductRequest,
} from '../product.model';
import type { ProductDataSource } from '../product-data-source';

/** REST implementation. The server owns IDs, barcodes, timestamps and stock rules. */
@Injectable()
export class ApiProductDataSource implements ProductDataSource {
  private readonly http = inject(HttpClient);
  private readonly collectionUrl: string;
  private readonly salesProductsUrl: string;

  constructor(@Inject(API_BASE_URL) baseUrl: string) {
    this.collectionUrl = apiEndpoint(baseUrl, 'products');
    this.salesProductsUrl = apiEndpoint(baseUrl, 'sales/products');
  }

  getAll(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.collectionUrl);
  }

  getSellableProducts(): Observable<SellableProductResponse[]> {
    return this.http.get<SellableProductResponse[]>(this.salesProductsUrl);
  }

  getById(id: number): Observable<ProductResponse | undefined> {
    return this.http.get<ProductResponse>(`${this.collectionUrl}/${id}`).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }

  getByBarcode(barcode: string): Observable<ProductResponse | undefined> {
    const encodedBarcode = encodeURIComponent(barcode.trim());
    return this.http.get<ProductResponse>(`${this.collectionUrl}/barcode/${encodedBarcode}`).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }

  create(request: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.collectionUrl, request);
  }

  update(id: number, request: UpdateProductRequest): Observable<ProductResponse | undefined> {
    return this.http.patch<ProductResponse>(`${this.collectionUrl}/${id}`, request).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }

  updateStockQuantity(_id: number, _quantity: number): Observable<ProductResponse | undefined> {
    // The API must update quantity only as part of POST /stock-operations so the
    // product change and stock-history row are committed in one transaction.
    return throwError(() => new Error('In API mode, change stock through a stock operation.'));
  }

  archive(id: number): Observable<ProductResponse | undefined> {
    return this.http.patch<ProductResponse>(`${this.collectionUrl}/${id}/archive`, {}).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }

  restore(id: number): Observable<ProductResponse | undefined> {
    return this.http.patch<ProductResponse>(`${this.collectionUrl}/${id}/restore`, {}).pipe(
      catchError(error => isNotFound(error) ? of(undefined) : throwError(() => error)),
    );
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}
