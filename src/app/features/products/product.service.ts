import { Inject, Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, throwError } from 'rxjs';

import type {
  CreateProductRequest,
  ProductDetailsRequest,
  ProductResponse,
  ProductTrackingMode,
  SellableProductResponse,
  UpdateProductRequest,
} from './product.model';
import { PRODUCT_DATA_SOURCE } from './product-data-source';
import type { ProductDataSource } from './product-data-source';
import { ProductCatalogService } from './product-catalog.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly catalog = inject(ProductCatalogService);

  constructor(
    @Inject(PRODUCT_DATA_SOURCE)
    private readonly dataSource: ProductDataSource,
  ) {}

  getProducts(): Observable<ProductResponse[]> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.getAll()),
    );
  }

  /** Employee-safe product projection used by the sales workspace. */
  getSellableProducts(): Observable<SellableProductResponse[]> {
    return this.dataSource.getSellableProducts();
  }

  getProductById(id: number): Observable<ProductResponse | undefined> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.getById(id)),
    );
  }

  getProductByBarcode(barcode: string): Observable<ProductResponse | undefined> {
    const normalizedBarcode = barcode.trim().toLocaleUpperCase();

    if (!normalizedBarcode) {
      return of(undefined);
    }

    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.getByBarcode(normalizedBarcode)),
    );
  }

  createProduct(request: CreateProductRequest): Observable<ProductResponse> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => {
        const validationError = this.validateProductDetails(
          request,
          request.trackingMode,
        );

        if (validationError) {
          return throwError(() => new Error(validationError));
        }

        if (!Number.isSafeInteger(request.quantity) || request.quantity < 1) {
          return throwError(
            () => new Error('Initial quantity must be a positive whole number.'),
          );
        }

        return this.dataSource.create({
          ...request,
          name: request.name.trim(),
          imageUrl: request.imageUrl?.trim() || null,
        });
      }),
    );
  }

  updateProduct(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.getById(id)),
      switchMap(existing => {
        if (!existing) {
          return of(undefined);
        }

        const validationError = this.validateProductDetails(
          request,
          existing.trackingMode,
        );

        if (validationError) {
          return throwError(() => new Error(validationError));
        }

        return this.dataSource.update(id, {
          ...request,
          name: request.name.trim(),
          imageUrl: request.imageUrl?.trim() || null,
        });
      }),
    );
  }

  /** Inventory is the only application workflow allowed to change stock quantity. */
  updateStockQuantity(
    id: number,
    quantity: number,
  ): Observable<ProductResponse | undefined> {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return throwError(
        () => new Error('Stock quantity must be a non-negative whole number.'),
      );
    }

    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.getById(id)),
      switchMap(product => {
        if (!product) {
          return of(undefined);
        }

        return this.dataSource.updateStockQuantity(id, quantity);
      }),
    );
  }

  archiveProduct(id: number): Observable<ProductResponse | undefined> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.archive(id)),
    );
  }

  restoreProduct(id: number): Observable<ProductResponse | undefined> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.dataSource.restore(id)),
    );
  }

  private validateProductDetails(
    request: ProductDetailsRequest,
    trackingMode: ProductTrackingMode,
  ): string | null {
    if (!request.name.trim()) {
      return 'Enter a product name.';
    }

    const categoryExists = this.catalog
      .getCategories()
      .some(category => category.id === request.categoryId);

    if (!categoryExists) {
      return 'Select a valid product category.';
    }

    const typeBelongsToCategory = this.catalog
      .getTypesForCategory(request.categoryId)
      .some(type => type.id === request.typeId);

    if (!typeBelongsToCategory) {
      return 'Select a valid type belonging to the selected category.';
    }

    if (trackingMode === 'PIECE' && request.weight !== null) {
      return 'Piece-based products cannot have a recorded weight.';
    }

    if (
      trackingMode === 'WEIGHTED' &&
      (request.weight === null ||
        !Number.isFinite(request.weight) ||
        request.weight <= 0)
    ) {
      return 'Enter a valid per-piece weight greater than zero for a weighted product.';
    }

    if (!Number.isFinite(request.purchasePrice) || request.purchasePrice < 0) {
      return 'Enter a valid purchase price.';
    }

    if (!Number.isFinite(request.salePrice) || request.salePrice < 0) {
      return 'Enter a valid sale price.';
    }

    return null;
  }
}
