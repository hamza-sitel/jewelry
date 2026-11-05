import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';

import { BrowserStorageService } from '../../core/services/browser-storage.service';
import { ProductService } from '../products/product.service';
import type { ProductResponse } from '../products/product.model';
import type { CreateStockOperationRequest } from './stock-operation.dto';
import { MockStockOperationDataSource } from './mock-stock-operation-data-source';

describe('MockStockOperationDataSource', () => {
  let dataSource: MockStockOperationDataSource;
  let currentProduct: ProductResponse;
  let productServiceMock: {
    getProductById: ReturnType<typeof vi.fn>;
    updateStockQuantity: ReturnType<typeof vi.fn>;
  };
  let storageMock: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  const buildProduct = (
    quantity: number,
    status: ProductResponse['status'] = 'ACTIVE',
  ): ProductResponse => ({
    id: 10,
    barcode: 'JWL000010',
    name: '18K Gold Ring',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 1,
    typeName: 'Ring',
    trackingMode: 'WEIGHTED',
    weight: 2.59,
    quantity,
    purchasePrice: 800,
    salePrice: 1200,
    status,
    imageUrl: null,
    createdAt: '2026-11-04T10:00:00.000Z',
  });

  const request = (
    type: CreateStockOperationRequest['type'],
    quantity: number,
  ): CreateStockOperationRequest => ({
    productId: 10,
    type,
    quantity,
    notes: null,
  });

  beforeEach(() => {
    currentProduct = buildProduct(6);

    productServiceMock = {
      getProductById: vi.fn(() => of(currentProduct)),
      updateStockQuantity: vi.fn((_id: number, quantity: number) => {
        currentProduct = { ...currentProduct, quantity };
        return of(currentProduct);
      }),
    };

    storageMock = {
      get: vi.fn((_key: string, fallback: unknown) => fallback),
      set: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MockStockOperationDataSource,
        { provide: ProductService, useValue: productServiceMock },
        { provide: BrowserStorageService, useValue: storageMock },
      ],
    });

    dataSource = TestBed.inject(MockStockOperationDataSource);
  });

  it('reduces weighted product quantity and records the history response', async () => {
    const operation = await firstValueFrom(dataSource.create(request('SALE', 2)));

    expect(operation.previousStock).toBe(6);
    expect(operation.newStock).toBe(4);
    expect(currentProduct.quantity).toBe(4);
    expect(storageMock.set).toHaveBeenCalledWith(
      'jewelry-stock.operations',
      expect.arrayContaining([expect.objectContaining({ quantity: 2, newStock: 4 })]),
    );
  });

  it('increases stock for a purchase of several pieces', async () => {
    const operation = await firstValueFrom(dataSource.create(request('PURCHASE', 5)));

    expect(operation.previousStock).toBe(6);
    expect(operation.newStock).toBe(11);
    expect(currentProduct.quantity).toBe(11);
  });

  it('rejects an operation that would make stock negative', async () => {
    currentProduct = buildProduct(2);

    await expect(firstValueFrom(dataSource.create(request('SALE', 3)))).rejects.toThrow(
      'Insufficient stock for this operation.',
    );
    expect(productServiceMock.updateStockQuantity).not.toHaveBeenCalled();
    expect(storageMock.set).not.toHaveBeenCalled();
  });

  it('rejects archived products', async () => {
    currentProduct = buildProduct(6, 'ARCHIVED');

    await expect(firstValueFrom(dataSource.create(request('SALE', 1)))).rejects.toThrow(
      'This product is archived.',
    );
    expect(productServiceMock.updateStockQuantity).not.toHaveBeenCalled();
  });

  it('restores the old quantity if stock history cannot be saved', async () => {
    storageMock.set.mockImplementation(() => {
      throw new Error('Storage is full.');
    });

    await expect(firstValueFrom(dataSource.create(request('SALE', 2)))).rejects.toThrow(
      'The previous stock quantity was restored',
    );

    expect(currentProduct.quantity).toBe(6);
    expect(productServiceMock.updateStockQuantity).toHaveBeenNthCalledWith(1, 10, 4);
    expect(productServiceMock.updateStockQuantity).toHaveBeenNthCalledWith(2, 10, 6);
  });
});
