import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { Observable } from 'rxjs';

import { Reports } from './reports';
import { ProductService } from '../products/product.service';
import type { ProductResponse } from '../products/product.model';
import { StockOperationService } from '../inventory/services/stock-operation.service';
import type { StockOperation } from '../inventory/stock-operation.model';
import { ReportExportService } from './report-export.service';

function createProduct(id: number, name: string, quantity: number, status: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE'): ProductResponse {
  return {
    id,
    name,
    barcode: `JWL${String(id).padStart(6, '0')}`,
    categoryId: id % 2 === 0 ? 2 : 1,
    categoryName: id % 2 === 0 ? 'Steel' : '18K Gold',
    typeId: id,
    typeName: id % 2 === 0 ? 'Bracelet' : 'Ring',
    trackingMode: id % 2 === 0 ? 'PIECE' : 'WEIGHTED',
    weight: id % 2 === 0 ? null : 2.5,
    quantity,
    purchasePrice: 100,
    salePrice: 150,
    imageUrl: null,
    status,
    createdAt: new Date(2026, 10, 1, 10 + id).toISOString(),
  };
}

const products = [
  createProduct(1, 'Gold Ring', 4),
  createProduct(2, 'Steel Bracelet', 2),
  createProduct(3, 'Archived Ring', 10, 'ARCHIVED'),
];

const operations: StockOperation[] = [
  {
    id: 1, productId: 1, productName: 'Gold Ring', barcode: 'JWL000001',
    type: 'PURCHASE', quantity: 5, previousStock: 0, newStock: 5,
    createdAt: '2026-11-04T10:00:00.000Z', notes: 'Supplier delivery',
  },
  {
    id: 2, productId: 1, productName: 'Gold Ring', barcode: 'JWL000001',
    type: 'SALE', quantity: 2, previousStock: 5, newStock: 3,
    createdAt: '2026-11-05T10:00:00.000Z', notes: 'Counter sale',
  },
  {
    id: 3, productId: 2, productName: 'Steel Bracelet', barcode: 'JWL000002',
    type: 'MANUAL_ADD', quantity: 1, previousStock: 1, newStock: 2,
    createdAt: '2026-11-05T11:00:00.000Z', notes: null,
  },
];

describe('Reports', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        { provide: ProductService, useValue: { getProducts: () => of(products) } },
        { provide: StockOperationService, useValue: { getOperations: () => of(operations) } },
        { provide: ReportExportService, useValue: { exportCsv: () => undefined, exportExcel: () => undefined } },
      ],
    }).compileComponents();
  });

  it('calculates stock totals using the selected product status', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    const reports = fixture.componentInstance;

    expect(reports.totalProducts).toBe(2);
    expect(reports.totalUnits).toBe(6);
    expect(reports.totalWeight).toBe(10);
    expect(reports.totalPurchaseValue).toBe(600);
    expect(reports.totalSaleValue).toBe(900);
    expect(reports.expectedGrossMargin).toBe(300);
  });

  it('filters and sorts stock products before pagination', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    const reports = fixture.componentInstance;

    reports.selectedCategory = 'Steel';
    reports.stockPage = 1;
    expect(reports.filteredStockProducts.map(product => product.name)).toEqual(['Steel Bracelet']);

    reports.selectedCategory = 'ALL';
    reports.stockSort = 'QUANTITY_DESC';
    expect(reports.filteredStockProducts.map(product => product.name)).toEqual([
      'Gold Ring',
      'Steel Bracelet',
    ]);
  });

  it('filters operations by type and calculates operation summaries', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    const reports = fixture.componentInstance;

    expect(reports.totalOperations).toBe(3);
    expect(reports.totalOperationQuantity).toBe(8);
    expect(reports.totalSalesQuantity).toBe(2);
    expect(reports.totalPurchasesQuantity).toBe(5);
    expect(reports.totalManualAdditions).toBe(1);

    reports.selectedOperationType = 'SALE';
    expect(reports.filteredOperations).toHaveLength(1);
    expect(reports.filteredOperations[0].type).toBe('SALE');
  });

  it('returns only the current page while keeping the full filtered count', () => {
    const manyProducts = Array.from({ length: 25 }, (_, index) => createProduct(index + 10, `Product ${index + 1}`, 4));
    const productService = TestBed.inject(ProductService) as unknown as { getProducts: () => Observable<ProductResponse[]> };
    productService.getProducts = () => of(manyProducts);

    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    const reports = fixture.componentInstance;

    expect(reports.filteredStockProducts).toHaveLength(25);
    expect(reports.paginatedStockProducts).toHaveLength(20);
    reports.setStockPage(2);
    expect(reports.paginatedStockProducts).toHaveLength(5);
  });
});
