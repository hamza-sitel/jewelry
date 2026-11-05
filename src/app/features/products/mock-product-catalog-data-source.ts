import { Injectable, inject } from '@angular/core';
import { defer, Observable, of } from 'rxjs';

import { BrowserStorageService } from '../../core/services/browser-storage.service';
import type {
  CreateCategoryRequest,
  CreateProductTypeRequest,
  ProductCatalogSnapshot,
  ProductCategoryResponse,
  ProductTypeResponse,
  UpdateCategoryRequest,
  UpdateProductTypeRequest,
} from './product.model';
import { MOCK_PRODUCT_CATALOG } from './product-catalog.mock';
import type { ProductCatalogDataSource } from './product-catalog-data-source';

@Injectable()
export class MockProductCatalogDataSource implements ProductCatalogDataSource {
  private readonly storage = inject(BrowserStorageService);
  private readonly categoriesStorageKey = 'jewelry-stock.categories';
  private readonly typesStorageKey = 'jewelry-stock.types';

  private categories = this.storage.get<ProductCategoryResponse[]>(
    this.categoriesStorageKey,
    MOCK_PRODUCT_CATALOG.categories,
  );

  private types = this.storage.get<ProductTypeResponse[]>(
    this.typesStorageKey,
    MOCK_PRODUCT_CATALOG.types,
  );

  getCatalog(): Observable<ProductCatalogSnapshot> {
    return of(this.copyCatalog());
  }

  createCategory(request: CreateCategoryRequest): Observable<ProductCategoryResponse> {
    return defer(() => {
      const name = request.name.trim();

      if (!name || this.categories.some(item => this.sameName(item.name, name))) {
        throw new Error('Enter a category name that is not already in use.');
      }

      const category: ProductCategoryResponse = {
        id: this.nextId(this.categories),
        name,
      };

      const updatedCategories = [...this.categories, category];
      this.storage.set(this.categoriesStorageKey, updatedCategories);
      this.categories = updatedCategories;
      return of({ ...category });
    });
  }

  updateCategory(
    id: number,
    request: UpdateCategoryRequest,
  ): Observable<ProductCategoryResponse | undefined> {
    return defer(() => {
      const name = request.name.trim();
      const current = this.categories.find(item => item.id === id);

      if (!current) {
        return of(undefined);
      }

      if (
        !name ||
        this.categories.some(item => item.id !== id && this.sameName(item.name, name))
      ) {
        throw new Error('Enter a category name that is not already in use.');
      }

      const updatedCategories = this.categories.map(item =>
        item.id === id ? { ...item, name } : item,
      );
      this.storage.set(this.categoriesStorageKey, updatedCategories);
      this.categories = updatedCategories;
      return of({ ...updatedCategories.find(item => item.id === id)! });
    });
  }

  createType(request: CreateProductTypeRequest): Observable<ProductTypeResponse> {
    return defer(() => {
      const name = request.name.trim();
      const categoryExists = this.categories.some(
        category => category.id === request.categoryId,
      );

      if (!categoryExists) {
        throw new Error('Choose an existing category before adding a type.');
      }

      if (
        !name ||
        this.types.some(
          type =>
            type.categoryId === request.categoryId && this.sameName(type.name, name),
        )
      ) {
        throw new Error('Enter a unique type name for this category.');
      }

      const type: ProductTypeResponse = {
        id: this.nextId(this.types),
        categoryId: request.categoryId,
        name,
      };

      const updatedTypes = [...this.types, type];
      this.storage.set(this.typesStorageKey, updatedTypes);
      this.types = updatedTypes;
      return of({ ...type });
    });
  }

  updateType(
    id: number,
    request: UpdateProductTypeRequest,
  ): Observable<ProductTypeResponse | undefined> {
    return defer(() => {
      const name = request.name.trim();
      const current = this.types.find(item => item.id === id);

      if (!current) {
        return of(undefined);
      }

      if (
        !name ||
        this.types.some(
          item =>
            item.id !== id &&
            item.categoryId === current.categoryId &&
            this.sameName(item.name, name),
        )
      ) {
        throw new Error('Enter a unique type name for this category.');
      }

      const updatedTypes = this.types.map(item =>
        item.id === id ? { ...item, name } : item,
      );
      this.storage.set(this.typesStorageKey, updatedTypes);
      this.types = updatedTypes;
      return of({ ...updatedTypes.find(item => item.id === id)! });
    });
  }

  private copyCatalog(): ProductCatalogSnapshot {
    return {
      categories: this.categories.map(category => ({ ...category })),
      types: this.types.map(type => ({ ...type })),
    };
  }

  private nextId(items: { id: number }[]): number {
    return Math.max(0, ...items.map(item => item.id)) + 1;
  }

  private sameName(first: string, second: string): boolean {
    return first.trim().toLocaleLowerCase() === second.trim().toLocaleLowerCase();
  }
}
