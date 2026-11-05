import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CategoryManagement } from './category-management';
import { PRODUCT_CATALOG_DATA_SOURCE } from '../../../products/product-catalog-data-source';
import { MockProductCatalogDataSource } from '../../../products/mock-product-catalog-data-source';

describe('CategoryManagement', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryManagement],
      providers: [
        provideRouter([]),
        {
          provide: PRODUCT_CATALOG_DATA_SOURCE,
          useClass: MockProductCatalogDataSource,
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CategoryManagement);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
