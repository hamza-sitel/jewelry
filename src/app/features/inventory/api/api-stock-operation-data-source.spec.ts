import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/api/api.config';
import { ApiStockOperationDataSource } from './api-stock-operation-data-source';

describe('ApiStockOperationDataSource', () => {
  let source: ApiStockOperationDataSource;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }, ApiStockOperationDataSource,
      ],
    });
    source = TestBed.inject(ApiStockOperationDataSource);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filters stock history by product ID', () => {
    source.getByProduct(42).subscribe();
    const request = http.expectOne('/api/stock-operations?productId=42');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('posts one stock command and expects the server-calculated result', () => {
    const command = { productId: 42, type: 'SALE' as const, quantity: 2, notes: null };
    source.create(command).subscribe();
    const request = http.expectOne('/api/stock-operations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(command);
    request.flush({
      id: 1, ...command, productName: 'Silver ring', barcode: 'JWL000042',
      previousStock: 5, newStock: 3, createdAt: '2026-11-07T10:00:00.000Z',
    });
  });
});
