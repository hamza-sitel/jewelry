import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { StockOperationService } from '../../services/stock-operation.service';
import type { StockOperationResponse } from '../../stock-operation.model';
import { StockHistory } from './stock-history';

const OPERATIONS: StockOperationResponse[] = [
  {
    id: 1,
    productId: 10,
    productName: 'Gold Ring',
    barcode: 'JWL000010',
    type: 'SALE',
    quantity: 2,
    previousStock: 6,
    newStock: 4,
    createdAt: '2026-11-05T10:00:00.000Z',
    notes: 'Counter sale',
  },
  {
    id: 2,
    productId: 11,
    productName: 'Steel Bracelet',
    barcode: 'JWL000011',
    type: 'PURCHASE',
    quantity: 5,
    previousStock: 3,
    newStock: 8,
    createdAt: '2026-11-04T10:00:00.000Z',
    notes: 'New delivery',
  },
];

describe('StockHistory', () => {
  let fixture: ComponentFixture<StockHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockHistory],
      providers: [
        provideRouter([]),
        {
          provide: StockOperationService,
          useValue: { getOperations: () => of(OPERATIONS) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StockHistory);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads the complete stock history sorted newest first', () => {
    const component = fixture.componentInstance;

    expect(component.operations).toHaveLength(2);
    expect(component.filteredOperations[0].id).toBe(1);
  });

  it('searches by product name, barcode, notes and product ID', () => {
    const component = fixture.componentInstance;

    component.searchTerm = 'JWL000011';

    expect(component.filteredOperations.map(operation => operation.id)).toEqual([2]);
  });

  it('filters by operation type and returns the list to page one', () => {
    const component = fixture.componentInstance;
    component.currentPage = 3;
    component.selectedFilter = 'PURCHASE';
    component.onFiltersChange();

    expect(component.currentPage).toBe(1);
    expect(component.filteredOperations.map(operation => operation.type)).toEqual([
      'PURCHASE',
    ]);
  });

  it('detects a reversed date range', () => {
    const component = fixture.componentInstance;
    component.dateFrom = '2026-11-06';
    component.dateTo = '2026-11-04';

    expect(component.dateRangeErrorMessage).toContain('start date');
    expect(component.filteredOperations).toEqual([]);
  });
});
