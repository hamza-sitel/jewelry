import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/api/api.config';
import { ApiProductDataSource } from './api-product-data-source';
import type { ProductResponse } from '../product.model';

describe('ApiProductDataSource', () => {
  let source: ApiProductDataSource;
  let http: HttpTestingController;

  const product: ProductResponse = {
    id: 12,
    barcode: 'JWL000012',
    name: 'Gold ring',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 1,
    typeName: 'Ring',
    trackingMode: 'WEIGHTED',
    weight: 2.5,
    quantity: 3,
    purchasePrice: 900,
    salePrice: 1200,
    imageUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-11-07T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:8080/api/' },
        ApiProductDataSource,
      ],
    });
    source = TestBed.inject(ApiProductDataSource);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads products from the REST collection endpoint', () => {
    let result: ProductResponse[] | undefined;
    source.getAll().subscribe(value => result = value);

    http.expectOne('http://localhost:8080/api/products').flush([product]);
    expect(result?.[0].barcode).toBe('JWL000012');
  });

  it('loads the employee-safe sale projection without purchase cost fields', () => {
    let result: unknown;
    source.getSellableProducts().subscribe(value => result = value);
    const request = http.expectOne('http://localhost:8080/api/sales/products');
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: product.id, barcode: product.barcode, name: product.name,
      categoryName: product.categoryName, typeName: product.typeName,
      trackingMode: product.trackingMode, weight: product.weight,
      quantity: product.quantity, status: product.status,
    }]);
    expect(result).toEqual([{
      id: product.id, barcode: product.barcode, name: product.name,
      categoryName: product.categoryName, typeName: product.typeName,
      trackingMode: product.trackingMode, weight: product.weight,
      quantity: product.quantity, status: product.status,
    }]);
    expect(JSON.stringify(result)).not.toContain('purchasePrice');
  });

  it('sends create DTOs without generating server-owned fields', () => {
    const request = {
      name: 'Gold ring', categoryId: 1, typeId: 1, trackingMode: 'WEIGHTED' as const,
      weight: 2.5, quantity: 3, purchasePrice: 900, salePrice: 1200, imageUrl: null,
    };
    source.create(request).subscribe();

    const testRequest = http.expectOne('http://localhost:8080/api/products');
    expect(testRequest.request.method).toBe('POST');
    expect(testRequest.request.body).toEqual(request);
    testRequest.flush(product);
  });

  it('uses the barcode lookup endpoint and URL-encodes the barcode', () => {
    source.getByBarcode('JWL 12').subscribe();
    const testRequest = http.expectOne('http://localhost:8080/api/products/barcode/JWL%2012');
    expect(testRequest.request.method).toBe('GET');
    testRequest.flush(product);
  });

  it('treats a product 404 as an absent record', () => {
    let result: ProductResponse | undefined | null = null;
    source.getById(999).subscribe(value => result = value);
    http.expectOne('http://localhost:8080/api/products/999').flush({}, { status: 404, statusText: 'Not Found' });
    expect(result).toBeUndefined();
  });
});
