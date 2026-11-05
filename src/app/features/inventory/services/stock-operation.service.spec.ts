import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';

import { STOCK_OPERATION_DATA_SOURCE } from '../stock-operation-data-source';
import type { CreateStockOperationRequest } from '../stock-operation.dto';
import type { StockOperationResponse } from '../stock-operation.model';
import { StockOperationService } from './stock-operation.service';

describe('StockOperationService', () => {
  let service: StockOperationService;
  let createSpy: ReturnType<typeof vi.fn>;

  const response: StockOperationResponse = {
    id: 1,
    productId: 10,
    productName: 'Test jewelry',
    barcode: 'JWL000010',
    type: 'SALE',
    quantity: 2,
    previousStock: 6,
    newStock: 4,
    createdAt: '2026-11-05T10:00:00.000Z',
    notes: 'Counter sale',
  };

  beforeEach(() => {
    createSpy = vi.fn(() => of(response));

    TestBed.configureTestingModule({
      providers: [
        StockOperationService,
        {
          provide: STOCK_OPERATION_DATA_SOURCE,
          useValue: {
            getAll: () => of([response]),
            getByProduct: () => of([response]),
            create: createSpy,
          },
        },
      ],
    });

    service = TestBed.inject(StockOperationService);
  });

  it('sends a valid create request to the data source', async () => {
    const request: CreateStockOperationRequest = {
      productId: 10,
      type: 'SALE',
      quantity: 2,
      notes: '  Counter sale  ',
    };

    const result = await firstValueFrom(service.createOperation(request));

    expect(result).toEqual(response);
    expect(createSpy).toHaveBeenCalledWith({ ...request, notes: 'Counter sale' });
  });

  it('rejects a missing or invalid product ID', async () => {
    const request = {
      productId: 0,
      type: 'SALE',
      quantity: 1,
      notes: null,
    } as CreateStockOperationRequest;

    await expect(firstValueFrom(service.createOperation(request))).rejects.toThrow(
      'Select a valid product.',
    );
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects zero, negative or fractional quantities', async () => {
    const request: CreateStockOperationRequest = {
      productId: 10,
      type: 'SALE',
      quantity: 1.5,
      notes: null,
    };

    await expect(firstValueFrom(service.createOperation(request))).rejects.toThrow(
      'Quantity must be a positive whole number.',
    );
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects notes longer than 500 characters', async () => {
    const request: CreateStockOperationRequest = {
      productId: 10,
      type: 'SALE',
      quantity: 1,
      notes: 'x'.repeat(501),
    };

    await expect(firstValueFrom(service.createOperation(request))).rejects.toThrow(
      'Notes cannot exceed 500 characters.',
    );
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('rejects an invalid operation type at runtime', async () => {
    const request = {
      productId: 10,
      type: 'TRANSFER',
      quantity: 1,
      notes: null,
    } as unknown as CreateStockOperationRequest;

    await expect(firstValueFrom(service.createOperation(request))).rejects.toThrow(
      'Select a valid stock operation type.',
    );
    expect(createSpy).not.toHaveBeenCalled();
  });
});
