import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { ProductCatalogService } from './product-catalog.service';
import { PRODUCT_CATALOG_DATA_SOURCE } from './product-catalog-data-source';
import type { ProductCatalogDataSource } from './product-catalog-data-source';
import { MOCK_PRODUCT_CATALOG } from './product-catalog.mock';

describe('ProductCatalogService', () => {
  let service: ProductCatalogService;
  let categories: { id: number; name: string }[] = MOCK_PRODUCT_CATALOG.categories.map(item => ({ ...item }));
  let types: { id: number; categoryId: number; name: string }[] = MOCK_PRODUCT_CATALOG.types.map(item => ({ ...item }));

  const dataSource: ProductCatalogDataSource = {
    getCatalog: () => of({ categories, types }),
    createCategory: request => {
      const category = { id: Math.max(0, ...categories.map(item => item.id)) + 1, name: request.name };
      categories = [...categories, category];
      return of(category);
    },
    updateCategory: (id, request) => {
      const existing = categories.find(item => item.id === id);
      if (!existing) return of(undefined);
      const updated = { ...existing, name: request.name };
      categories = categories.map(item => item.id === id ? updated : item);
      return of(updated);
    },
    createType: request => {
      const type = {
        id: Math.max(0, ...types.map(item => item.id)) + 1,
        categoryId: request.categoryId,
        name: request.name,
      };
      types = [...types, type];
      return of(type);
    },
    updateType: (id, request) => {
      const existing = types.find(item => item.id === id);
      if (!existing) return of(undefined);
      const updated = { ...existing, name: request.name };
      types = types.map(item => item.id === id ? updated : item);
      return of(updated);
    },
  };

  beforeEach(async () => {
    categories = MOCK_PRODUCT_CATALOG.categories.map(item => ({ ...item }));
    types = MOCK_PRODUCT_CATALOG.types.map(item => ({ ...item }));

    TestBed.configureTestingModule({
      providers: [
        ProductCatalogService,
        { provide: PRODUCT_CATALOG_DATA_SOURCE, useValue: dataSource },
      ],
    });

    service = TestBed.inject(ProductCatalogService);
    await firstValueFrom(service.loadCatalog());
  });

  it('trims and adds a new category', async () => {
    const category = await firstValueFrom(service.addCategory('  Titanium  '));

    expect(category.name).toBe('Titanium');
    expect(service.getCategories().some(item => item.id === category.id)).toBe(true);
  });

  it('rejects category names that differ only by letter casing', async () => {
    await expect(firstValueFrom(service.addCategory('18k gold'))).rejects.toThrow(
      'unique category name',
    );
  });

  it('does not create a type for a category that does not exist', async () => {
    await expect(firstValueFrom(service.addType(999, 'Ring'))).rejects.toThrow(
      'valid category',
    );
  });
});
