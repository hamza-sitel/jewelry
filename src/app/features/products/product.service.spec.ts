import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ProductService } from './product.service';
import { PRODUCT_DATA_SOURCE } from './product-data-source';
import type { ProductDataSource } from './product-data-source';
import { PRODUCT_CATALOG_DATA_SOURCE } from './product-catalog-data-source';
import type { ProductCatalogDataSource } from './product-catalog-data-source';
import { MOCK_PRODUCT_CATALOG } from './product-catalog.mock';
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './product.model';

describe('ProductService', () => {
  let service: ProductService;
  let lastUpdateRequest: UpdateProductRequest | null = null;

  const weightedProduct: ProductResponse = {
    id: 100,
    barcode: 'JWL000100',
    name: 'Gold ring',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 1,
    typeName: 'Ring',
    trackingMode: 'WEIGHTED',
    weight: 2.59,
    quantity: 1,
    purchasePrice: 800,
    salePrice: 1200,
    status: 'ACTIVE',
    imageUrl: null,
    createdAt: '2026-11-04T00:00:00.000Z',
  };

  const productDataSource: ProductDataSource = {
    getAll: () => of([weightedProduct]),
    getById: id => of(id === weightedProduct.id ? weightedProduct : undefined),
    getByBarcode: barcode =>
      of(barcode === weightedProduct.barcode ? weightedProduct : undefined),
    create: (request: CreateProductRequest) =>
      of({
        ...request,
        id: 101,
        barcode: 'JWL000101',
        categoryName: 'Steel',
        typeName: 'Bracelet',
        status: 'ACTIVE',
        createdAt: '2026-11-04T00:00:00.000Z',
      } satisfies ProductResponse),
    update: (id, request) => {
      lastUpdateRequest = request;
      return of(id === weightedProduct.id ? { ...weightedProduct, ...request } : undefined);
    },
    updateStockQuantity: (id, quantity) =>
      of(id === weightedProduct.id ? { ...weightedProduct, quantity } : undefined),
    archive: () => of(undefined),
    restore: () => of(undefined),
  };

  const catalogDataSource: ProductCatalogDataSource = {
    getCatalog: () => of(MOCK_PRODUCT_CATALOG),
    createCategory: () => throwError(() => new Error('Not used in this test.')),
    updateCategory: () => of(undefined),
    createType: () => throwError(() => new Error('Not used in this test.')),
    updateType: () => of(undefined),
  };

  beforeEach(() => {
    lastUpdateRequest = null;

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: PRODUCT_DATA_SOURCE, useValue: productDataSource },
        { provide: PRODUCT_CATALOG_DATA_SOURCE, useValue: catalogDataSource },
      ],
    });

    service = TestBed.inject(ProductService);
  });

  it('allows a piece-based product to have multiple pieces and no weight', async () => {
    const created = await firstValueFrom(
      service.createProduct({
        name: 'Steel bracelet',
        categoryId: 3,
        typeId: 11,
        trackingMode: 'PIECE',
        weight: null,
        quantity: 8,
        purchasePrice: 20,
        salePrice: 40,
        imageUrl: null,
      }),
    );

    expect(created.quantity).toBe(8);
    expect(created.weight).toBeNull();
    expect(created.trackingMode).toBe('PIECE');
  });

  it('allows a weighted product to have multiple pieces with a per-piece weight', async () => {
    const created = await firstValueFrom(
      service.createProduct({
        name: 'Gold ring',
        categoryId: 1,
        typeId: 1,
        trackingMode: 'WEIGHTED',
        weight: 2.59,
        quantity: 4,
        purchasePrice: 800,
        salePrice: 1200,
        imageUrl: null,
      }),
    );

    expect(created.quantity).toBe(4);
    expect(created.weight).toBe(2.59);
    expect(created.weight! * created.quantity).toBe(10.36);
  });

  it('rejects piece-based products when a weight is supplied', async () => {
    await expect(
      firstValueFrom(
        service.createProduct({
          name: 'Steel chain',
          categoryId: 3,
          typeId: 12,
          trackingMode: 'PIECE',
          weight: 4,
          quantity: 5,
          purchasePrice: 25,
          salePrice: 50,
          imageUrl: null,
        }),
      ),
    ).rejects.toThrow('cannot have a recorded weight');
  });

  it('updates product details without changing tracking mode or stock quantity', async () => {
    const updated = await firstValueFrom(
      service.updateProduct(100, {
        name: 'Updated gold ring',
        categoryId: 1,
        typeId: 1,
        weight: 2.7,
        purchasePrice: 820,
        salePrice: 1250,
        imageUrl: null,
      }),
    );

    expect(updated?.quantity).toBe(1);
    expect(updated?.trackingMode).toBe('WEIGHTED');
    expect(lastUpdateRequest).not.toBeNull();
    expect(lastUpdateRequest).not.toHaveProperty('quantity');
    expect(lastUpdateRequest).not.toHaveProperty('trackingMode');
  });

  it('looks up a barcode after normalizing its casing and whitespace', async () => {
    const result = await firstValueFrom(service.getProductByBarcode('  jwl000100 '));
    expect(result?.id).toBe(100);
  });
});
