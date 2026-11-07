import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL, apiEndpoint } from '../../../core/api/api.config';
import type { CreateStockOperationRequest } from '../stock-operation.dto';
import type { StockOperationDataSource } from '../stock-operation-data-source';
import type { StockOperationResponse } from '../stock-operation.model';

/**
 * REST implementation. Creating an operation is one server command: Spring Boot
 * must update stock and insert the history row in one database transaction.
 */
@Injectable()
export class ApiStockOperationDataSource implements StockOperationDataSource {
  private readonly http = inject(HttpClient);
  private readonly collectionUrl: string;

  constructor(@Inject(API_BASE_URL) baseUrl: string) {
    this.collectionUrl = apiEndpoint(baseUrl, 'stock-operations');
  }

  getAll(): Observable<StockOperationResponse[]> {
    return this.http.get<StockOperationResponse[]>(this.collectionUrl);
  }

  getByProduct(productId: number): Observable<StockOperationResponse[]> {
    const params = new HttpParams().set('productId', productId);
    return this.http.get<StockOperationResponse[]>(this.collectionUrl, { params });
  }

  create(request: CreateStockOperationRequest): Observable<StockOperationResponse> {
    return this.http.post<StockOperationResponse>(this.collectionUrl, request);
  }
}
