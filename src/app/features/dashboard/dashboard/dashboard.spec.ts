import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { ProductService } from '../../products/product.service';
import type { ProductResponse } from '../../products/product.model';
import { StockOperationService } from '../../inventory/services/stock-operation.service';
import type { StockOperation } from '../../inventory/stock-operation.model';

const products: ProductResponse[] = [
  {
    id: 1,
    name: 'Gold Ring',
    barcode: 'JWL000001',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 1,
    typeName: 'Ring',
    trackingMode: 'WEIGHTED',
    weight: 2.59,
    quantity: 4,
    purchasePrice: 100,
    salePrice: 150,
    imageUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Steel Bracelet',
    barcode: 'JWL000002',
    categoryId: 2,
    categoryName: 'Steel',
    typeId: 2,
    typeName: 'Bracelet',
    trackingMode: 'PIECE',
    weight: null,
    quantity: 2,
    purchasePrice: 10,
    salePrice: 20,
    imageUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'Archived Chain',
    barcode: 'JWL000003',
    categoryId: 1,
    categoryName: '18K Gold',
    typeId: 3,
    typeName: 'Chain',
    trackingMode: 'WEIGHTED',
    weight: 1.5,
    quantity: 8,
    purchasePrice: 80,
    salePrice: 120,
    imageUrl: null,
    status: 'ARCHIVED',
    createdAt: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 4,
    name: 'Empty Pendant',
    barcode: 'JWL000004',
    categoryId: 2,
    categoryName: 'Steel',
    typeId: 4,
    typeName: 'Pendant',
    trackingMode: 'PIECE',
    weight: null,
    quantity: 0,
    purchasePrice: 5,
    salePrice: 10,
    imageUrl: null,
    status: 'ACTIVE',
    createdAt: '2026-11-04T10:00:00.000Z',
  },
];

const operationTestTime = Date.now();

const operations: StockOperation[] = [
  {
    id: 1,
    productId: 1,
    productName: 'Gold Ring',
    barcode: 'JWL000001',
    type: 'PURCHASE',
    quantity: 3,
    previousStock: 1,
    newStock: 4,
    createdAt: new Date(operationTestTime - 60_000).toISOString(),
    notes: null,
  },
  {
    id: 2,
    productId: 1,
    productName: 'Gold Ring',
    barcode: 'JWL000001',
    type: 'SALE',
    quantity: 2,
    previousStock: 6,
    newStock: 4,
    createdAt: new Date(operationTestTime).toISOString(),
    notes: 'Counter sale',
  },
];

describe('Dashboard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: { getProducts: () => of(products) } },
        { provide: StockOperationService, useValue: { getOperations: () => of(operations) } },
      ],
    }).compileComponents();
  });

  it('calculates inventory metrics from active products only', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;

    expect(dashboard.totalProducts).toBe(4);
    expect(dashboard.activeProductsCount).toBe(3);
    expect(dashboard.archivedProductsCount).toBe(1);
    expect(dashboard.totalUnits).toBe(6);
    expect(dashboard.recordedTotalWeight).toBeCloseTo(10.36, 2);
    expect(dashboard.inventoryPurchaseValue).toBe(420);
    expect(dashboard.inventorySaleValue).toBe(640);
    expect(dashboard.expectedGrossMargin).toBe(220);
    expect(dashboard.lowStockCount).toBe(1);
    expect(dashboard.outOfStockCount).toBe(1);
  });

  it('builds category distribution and a valid doughnut background', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;

    expect(dashboard.categoryMetrics).toHaveLength(2);
    expect(dashboard.categoryMetrics[0].name).toBe('18K Gold');
    expect(dashboard.categoryChartBackground).toContain('conic-gradient');
  });

  it('aggregates recent stock movements and builds curved chart paths', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;

    expect(dashboard.hasWeeklyMovement).toBe(true);
    expect(dashboard.weeklyMovement).toHaveLength(7);
    expect(dashboard.purchaseLinePath).toContain('C');
    expect(dashboard.saleLinePath).toContain('C');
    expect(dashboard.saleAreaPath).toContain('Z');
  });

  it('groups movement quantities by operation type', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;

    expect(dashboard.operationMix.find(item => item.type === 'PURCHASE')?.quantity).toBe(3);
    expect(dashboard.operationMix.find(item => item.type === 'SALE')?.quantity).toBe(2);
    expect(dashboard.recentOperations[0].id).toBe(2);
  });
});
