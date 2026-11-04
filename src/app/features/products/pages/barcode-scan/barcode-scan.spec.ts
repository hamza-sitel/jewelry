import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BarcodeScan } from './barcode-scan';

import { PRODUCT_DATA_SOURCE } from '../../product-data-source';
import { MockProductDataSource } from '../../mock-product-data-source';

import { STOCK_OPERATION_DATA_SOURCE } from '../../../inventory/stock-operation-data-source';
import { MockStockOperationDataSource } from '../../../inventory/mock-stock-operation-data-source';

describe('BarcodeScan', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeScan],
      providers: [
        provideRouter([]),

        {
          provide: PRODUCT_DATA_SOURCE,
          useClass: MockProductDataSource,
        },

        {
          provide: STOCK_OPERATION_DATA_SOURCE,
          useClass: MockStockOperationDataSource,
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BarcodeScan);

    expect(fixture.componentInstance).toBeTruthy();
  });
});