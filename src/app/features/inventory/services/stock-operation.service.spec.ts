import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ProductService } from '../../products/product.service';
import type { ProductResponse } from '../../products/product.model';
import { StockOperationService } from './stock-operation.service';
import { STOCK_OPERATION_DATA_SOURCE } from '../stock-operation-data-source';
import type { StockOperationDataSource } from '../stock-operation-data-source';
import type { StockOperation } from '../stock-operation.model';

describe('StockOperationService', () => {
  let service: StockOperationService;
  let currentProduct: ProductResponse;
  let createdOperations: StockOperation[];

  const buildProduct = (
    trackingMode: ProductResponse['trackingMode'],
    quantity: number,
  ): ProductResponse => ({
    id: 10,
    barcode: 'JWL000010',
    name: 'Test jewelry',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 1,
    typeName: 'Ring',
    trackingMode,
    weight: trackingMode === 'WEIGHTED' ? 2.59 : null,
    quantity,
    purchasePrice: 800,
    salePrice: 1200,
    status: 'ACTIVE',
    imageUrl: null,
    createdAt: '2026-11-04T00:00:00.000Z',
  });

  const productServiceMock = {
    getProductById: () => of(currentProduct),
    updateStockQuantity: (_id: number, quantity: number) => {
      currentProduct = { ...currentProduct, quantity };
      return of(currentProduct);
    },
  };

  const stockDataSourceMock: StockOperationDataSource = {
    getAll: () => of(createdOperations),
    getByProduct: productId =>
      of(createdOperations.filter(operation => operation.productId === productId)),
    create: operation => {
      const created: StockOperation = { ...operation, id: createdOperations.length + 1 };
      createdOperations = [created, ...createdOperations];
      return of(created);
    },
  };

  beforeEach(() => {
    currentProduct = buildProduct('WEIGHTED', 1);
    createdOperations = [];

    TestBed.configureTestingModule({
      providers: [
        StockOperationService,
        { provide: ProductService, useValue: productServiceMock },
        { provide: STOCK_OPERATION_DATA_SOURCE, useValue: stockDataSourceMock },
      ],
    });

    service = TestBed.inject(StockOperationService);
  });

  it('allows weighted stock to be reduced by multiple pieces in one operation', async () => {
    currentProduct = buildProduct('WEIGHTED', 6);

    const operation = await firstValueFrom(
      service.createOperation(10, 'SALE', 2),
    );

    expect(operation.previousStock).toBe(6);
    expect(operation.newStock).toBe(4);
    expect(currentProduct.quantity).toBe(4);
  });

  it('allows weighted stock to be increased by multiple pieces in one operation', async () => {
    currentProduct = buildProduct('WEIGHTED', 3);

    const operation = await firstValueFrom(
      service.createOperation(10, 'PURCHASE', 5),
    );

    expect(operation.previousStock).toBe(3);
    expect(operation.newStock).toBe(8);
    expect(currentProduct.quantity).toBe(8);
  });

  it('allows piece-based stock to increase by multiple units', async () => {
    currentProduct = buildProduct('PIECE', 10);

    const operation = await firstValueFrom(
      service.createOperation(10, 'MANUAL_ADD', 5),
    );

    expect(operation.newStock).toBe(15);
    expect(currentProduct.quantity).toBe(15);
  });

});
