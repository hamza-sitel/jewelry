import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SalesWorkspace } from './sales-workspace';
import { ProductService } from '../products/product.service';
import type { ProductResponse } from '../products/product.model';
import { StockOperationService } from '../inventory/services/stock-operation.service';
import type { CreateStockOperationRequest } from '../inventory/stock-operation.dto';

const product: ProductResponse = {
  id: 1, name: 'Gold Ring', barcode: 'JWL000001', categoryId: 1, categoryName: '18K Gold', typeId: 1, typeName: 'Ring',
  trackingMode: 'WEIGHTED', weight: 2.5, quantity: 4, purchasePrice: 100, salePrice: 150, imageUrl: null, status: 'ACTIVE', createdAt: '2026-11-01T10:00:00.000Z',
};

describe('SalesWorkspace', () => {
  let component: SalesWorkspace;
  let submittedRequest: CreateStockOperationRequest | null;

  beforeEach(async () => {
    submittedRequest = null;
    const stockService = {
      createOperation: (request: CreateStockOperationRequest) => {
        submittedRequest = request;
        return of({ id: 1, productId: 1, productName: product.name, barcode: product.barcode, type: 'SALE' as const, quantity: request.quantity, previousStock: 4, newStock: 4 - request.quantity, createdAt: new Date().toISOString(), notes: request.notes });
      },
    };
    await TestBed.configureTestingModule({
      imports: [SalesWorkspace],
      providers: [
        { provide: ProductService, useValue: { getProducts: () => of([product]) } },
        { provide: StockOperationService, useValue: stockService },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SalesWorkspace);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('loads active stock and selects a product', () => {
    expect(component.activeProducts).toHaveLength(1);
    component.selectProduct(product);
    expect(component.selectedProduct?.id).toBe(1);
  });

  it('records a sale through the existing stock operation workflow', () => {
    component.selectProduct(product);
    component.quantity = 2;
    component.submitSale();
    expect(submittedRequest).toEqual({ productId: 1, type: 'SALE', quantity: 2, notes: null });
    expect(component.selectedProduct?.quantity).toBe(2);
  });
});
