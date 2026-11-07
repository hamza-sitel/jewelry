import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, tap } from 'rxjs';

import type {
  CreateCategoryRequest,
  CreateProductTypeRequest,
  ProductCatalogSnapshot,
  ProductCategory,
  ProductType,
  UpdateCategoryRequest,
  UpdateProductTypeRequest,
} from './product.model';
import { PRODUCT_CATALOG_DATA_SOURCE } from './product-catalog-data-source';

/** Application-facing service for category and product-type operations. */
@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly dataSource = inject(PRODUCT_CATALOG_DATA_SOURCE);
  // Start empty: the selected data source must provide the catalog. This prevents
  // mock fixtures from leaking into API mode before the first successful load.
  private snapshot: ProductCatalogSnapshot = { categories: [], types: [] };

  loadCatalog(): Observable<ProductCatalogSnapshot> {
    return this.dataSource.getCatalog().pipe(
      tap(catalog => {
        this.snapshot = this.copyCatalog(catalog);
      }),
    );
  }

  getCategories(): ProductCategory[] {
    return this.snapshot.categories.map(category => ({ ...category }));
  }

  getTypes(): ProductType[] {
    return this.snapshot.types.map(type => ({ ...type }));
  }

  getTypesForCategory(categoryId: number): ProductType[] {
    return this.snapshot.types
      .filter(type => type.categoryId === categoryId)
      .map(type => ({ ...type }));
  }

  categoryHasTypes(categoryId: number): boolean {
    return this.snapshot.types.some(type => type.categoryId === categoryId);
  }

  getCategoryName(categoryId: number): string {
    return (
      this.snapshot.categories.find(category => category.id === categoryId)?.name ??
      'Unknown category'
    );
  }

  getTypeName(typeId: number): string {
    return this.snapshot.types.find(type => type.id === typeId)?.name ?? 'Unknown type';
  }

  addCategory(name: string): Observable<ProductCategory> {
    const normalizedName = name.trim();

    if (
      !normalizedName ||
      this.snapshot.categories.some(category =>
        this.sameName(category.name, normalizedName),
      )
    ) {
      return throwError(() => new Error('Enter a unique category name.'));
    }

    const request: CreateCategoryRequest = { name: normalizedName };

    return this.dataSource.createCategory(request).pipe(
      tap(category => {
        this.snapshot = {
          ...this.snapshot,
          categories: [...this.snapshot.categories, category],
        };
      }),
    );
  }

  updateCategory(id: number, name: string): Observable<ProductCategory | undefined> {
    const normalizedName = name.trim();
    const current = this.snapshot.categories.find(category => category.id === id);

    if (!current) {
      return of(undefined);
    }

    if (
      !normalizedName ||
      this.snapshot.categories.some(
        category =>
          category.id !== id && this.sameName(category.name, normalizedName),
      )
    ) {
      return throwError(() => new Error('Enter a unique category name.'));
    }

    const request: UpdateCategoryRequest = { name: normalizedName };

    return this.dataSource.updateCategory(id, request).pipe(
      tap(updated => {
        if (updated) {
          this.snapshot = {
            ...this.snapshot,
            categories: this.snapshot.categories.map(category =>
              category.id === id ? updated : category,
            ),
          };
        }
      }),
    );
  }

  addType(categoryId: number, name: string): Observable<ProductType> {
    const normalizedName = name.trim();
    const categoryExists = this.snapshot.categories.some(
      category => category.id === categoryId,
    );

    if (!categoryExists) {
      return throwError(() => new Error('Choose a valid category before adding a type.'));
    }

    if (
      !normalizedName ||
      this.snapshot.types.some(
        type =>
          type.categoryId === categoryId && this.sameName(type.name, normalizedName),
      )
    ) {
      return throwError(() => new Error('Enter a unique type name for this category.'));
    }

    const request: CreateProductTypeRequest = {
      categoryId,
      name: normalizedName,
    };

    return this.dataSource.createType(request).pipe(
      tap(type => {
        this.snapshot = {
          ...this.snapshot,
          types: [...this.snapshot.types, type],
        };
      }),
    );
  }

  updateType(id: number, name: string): Observable<ProductType | undefined> {
    const normalizedName = name.trim();
    const current = this.snapshot.types.find(type => type.id === id);

    if (!current) {
      return of(undefined);
    }

    if (
      !normalizedName ||
      this.snapshot.types.some(
        type =>
          type.id !== id &&
          type.categoryId === current.categoryId &&
          this.sameName(type.name, normalizedName),
      )
    ) {
      return throwError(() => new Error('Enter a unique type name for this category.'));
    }

    const request: UpdateProductTypeRequest = { name: normalizedName };

    return this.dataSource.updateType(id, request).pipe(
      tap(updated => {
        if (updated) {
          this.snapshot = {
            ...this.snapshot,
            types: this.snapshot.types.map(type => (type.id === id ? updated : type)),
          };
        }
      }),
    );
  }

  private copyCatalog(catalog: ProductCatalogSnapshot): ProductCatalogSnapshot {
    return {
      categories: catalog.categories.map(category => ({ ...category })),
      types: catalog.types.map(type => ({ ...type })),
    };
  }

  private sameName(first: string, second: string): boolean {
    return first.trim().toLocaleLowerCase() === second.trim().toLocaleLowerCase();
  }
}
