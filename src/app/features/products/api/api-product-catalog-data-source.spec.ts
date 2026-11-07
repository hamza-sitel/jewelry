import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/api/api.config';
import { ApiProductCatalogDataSource } from './api-product-catalog-data-source';

describe('ApiProductCatalogDataSource', () => {
  let source: ApiProductCatalogDataSource;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }, ApiProductCatalogDataSource,
      ],
    });
    source = TestBed.inject(ApiProductCatalogDataSource);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads categories and their types as one catalog snapshot', () => {
    let result: unknown;
    source.getCatalog().subscribe(value => result = value);
    const request = http.expectOne('/api/catalog');
    expect(request.request.method).toBe('GET');
    request.flush({ categories: [{ id: 1, name: '18K Gold' }], types: [{ id: 2, categoryId: 1, name: 'Ring' }] });
    expect(result).toEqual({ categories: [{ id: 1, name: '18K Gold' }], types: [{ id: 2, categoryId: 1, name: 'Ring' }] });
  });

  it('posts category-specific type requests', () => {
    const request = { categoryId: 1, name: 'Necklace' };
    source.createType(request).subscribe();
    const testRequest = http.expectOne('/api/product-types');
    expect(testRequest.request.method).toBe('POST');
    expect(testRequest.request.body).toEqual(request);
    testRequest.flush({ id: 7, ...request });
  });
});
