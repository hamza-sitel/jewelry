import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, of, switchMap } from 'rxjs';

import { BrowserStorageService } from '../../core/services/browser-storage.service';
import type {
  CreateProductRequest,
  ProductResponse,
  ProductTrackingMode,
  SellableProductResponse,
  UpdateProductRequest,
} from './product.model';
import { MOCK_PRODUCTS } from './product.mock';
import { ProductCatalogService } from './product-catalog.service';
import type { ProductDataSource } from './product-data-source';

@Injectable()
export class MockProductDataSource implements ProductDataSource {
  private readonly catalog = inject(ProductCatalogService);
  private readonly storage = inject(BrowserStorageService);
  private readonly storageKey = 'jewelry-stock.products';

  private products: ProductResponse[];

  constructor() {
    const savedProducts = this.storage.get<unknown>(this.storageKey, null);

    if (Array.isArray(savedProducts)) {
      this.products = savedProducts
        .filter(this.isRecord)
        .map((product, index) => this.normalizeStoredProduct(product, index + 1));

      // Convert the old tracking values once, preserving all existing quantities.
      this.saveProducts();
    } else {
      this.products = MOCK_PRODUCTS.map(product => ({ ...product }));
      this.saveProducts();
    }
  }

  getAll(): Observable<ProductResponse[]> {
    return of(this.products.map(product => this.withCurrentNames(product)));
  }

  getSellableProducts(): Observable<SellableProductResponse[]> {
    return this.catalog.loadCatalog().pipe(
      switchMap(() => this.getAll()),
      map(products => products.map(product => ({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        categoryName: product.categoryName,
        typeName: product.typeName,
        trackingMode: product.trackingMode,
        weight: product.weight,
        quantity: product.quantity,
        status: product.status,
      }))),
    );
  }

  getById(id: number): Observable<ProductResponse | undefined> {
    const product = this.products.find(item => item.id === id);
    return of(product ? this.withCurrentNames(product) : undefined);
  }

  getByBarcode(barcode: string): Observable<ProductResponse | undefined> {
    const normalizedBarcode = barcode.trim().toLocaleUpperCase();
    const product = this.products.find(
      item => item.barcode.toLocaleUpperCase() === normalizedBarcode,
    );
    return of(product ? this.withCurrentNames(product) : undefined);
  }

  create(request: CreateProductRequest): Observable<ProductResponse> {
    return defer(() => {
      const id = this.getNextId();
      const product: ProductResponse = {
        ...request,
        id,
        barcode: `JWL${String(id).padStart(6, '0')}`,
        name: request.name.trim(),
        categoryName: this.catalog.getCategoryName(request.categoryId),
        typeName: this.catalog.getTypeName(request.typeId),
        status: 'ACTIVE',
        imageUrl: request.imageUrl?.trim() || null,
        createdAt: new Date().toISOString(),
      };

      const updatedProducts = [...this.products, product];
      this.storage.set(this.storageKey, updatedProducts);
      this.products = updatedProducts;
      return of(this.withCurrentNames(product));
    });
  }

  update(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined> {
    return defer(() => {
      const existing = this.products.find(item => item.id === id);

      if (!existing) {
        return of(undefined);
      }

      const updatedProduct: ProductResponse = {
        ...existing,
        ...request,
        // These server-owned or stock-owned values cannot be changed by this request.
        id: existing.id,
        barcode: existing.barcode,
        trackingMode: existing.trackingMode,
        quantity: existing.quantity,
        status: existing.status,
        createdAt: existing.createdAt,
        categoryName: this.catalog.getCategoryName(request.categoryId),
        typeName: this.catalog.getTypeName(request.typeId),
        name: request.name.trim(),
        imageUrl: request.imageUrl?.trim() || null,
      };

      const updatedProducts = this.products.map(product =>
        product.id === id ? updatedProduct : product,
      );
      this.storage.set(this.storageKey, updatedProducts);
      this.products = updatedProducts;
      return of(this.withCurrentNames(updatedProduct));
    });
  }

  updateStockQuantity(
    id: number,
    quantity: number,
  ): Observable<ProductResponse | undefined> {
    return defer(() => {
      const product = this.products.find(item => item.id === id);

      if (!product) {
        return of(undefined);
      }

      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error('Stock quantity must be a non-negative whole number.');
      }

      const updatedProduct = { ...product, quantity };
      const updatedProducts = this.products.map(item =>
        item.id === id ? updatedProduct : item,
      );
      this.storage.set(this.storageKey, updatedProducts);
      this.products = updatedProducts;
      return of(this.withCurrentNames(updatedProduct));
    });
  }

  archive(id: number): Observable<ProductResponse | undefined> {
    return this.changeStatus(id, 'ARCHIVED');
  }

  restore(id: number): Observable<ProductResponse | undefined> {
    return this.changeStatus(id, 'ACTIVE');
  }

  private changeStatus(
    id: number,
    status: ProductResponse['status'],
  ): Observable<ProductResponse | undefined> {
    return defer(() => {
      const product = this.products.find(item => item.id === id);

      if (!product) {
        return of(undefined);
      }

      const updatedProduct = { ...product, status };
      const updatedProducts = this.products.map(item =>
        item.id === id ? updatedProduct : item,
      );
      this.storage.set(this.storageKey, updatedProducts);
      this.products = updatedProducts;
      return of(this.withCurrentNames(updatedProduct));
    });
  }

  private normalizeStoredProduct(
    value: Record<string, unknown>,
    fallbackId: number,
  ): ProductResponse {
    const id = this.toPositiveInteger(value['id']) ?? fallbackId;
    const weight = this.toPositiveNumber(value['weight']);
    // Old records with a positive per-piece weight become WEIGHTED; all others become PIECE.
    // Quantity is preserved for both modes and is not restricted by tracking mode.
    const trackingMode: ProductTrackingMode = weight !== null ? 'WEIGHTED' : 'PIECE';
    const normalizedWeight = trackingMode === 'PIECE' ? null : weight;
    const quantity = this.toNonNegativeInteger(value['quantity']) ?? 0;
    const categoryId = this.toPositiveInteger(value['categoryId']) ?? 1;
    const typeId = this.toPositiveInteger(value['typeId']) ?? 1;

    return {
      id,
      barcode:
        typeof value['barcode'] === 'string' && value['barcode'].trim()
          ? value['barcode']
          : `JWL${String(id).padStart(6, '0')}`,
      name: typeof value['name'] === 'string' ? value['name'] : 'Unnamed product',
      categoryId,
      categoryName:
        typeof value['categoryName'] === 'string' ? value['categoryName'] : '',
      typeId,
      typeName: typeof value['typeName'] === 'string' ? value['typeName'] : '',
      trackingMode,
      weight: normalizedWeight,
      quantity,
      purchasePrice: this.toNonNegativeNumber(value['purchasePrice']) ?? 0,
      salePrice: this.toNonNegativeNumber(value['salePrice']) ?? 0,
      status: value['status'] === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
      imageUrl: typeof value['imageUrl'] === 'string' ? value['imageUrl'] : null,
      createdAt:
        typeof value['createdAt'] === 'string'
          ? value['createdAt']
          : new Date().toISOString(),
    };
  }

  private withCurrentNames(product: ProductResponse): ProductResponse {
    return {
      ...product,
      categoryName: this.catalog.getCategoryName(product.categoryId),
      typeName: this.catalog.getTypeName(product.typeId),
    };
  }

  private saveProducts(): void {
    this.storage.set(this.storageKey, this.products);
  }

  private getNextId(): number {
    return Math.max(0, ...this.products.map(product => product.id)) + 1;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toPositiveInteger(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
      ? value
      : null;
  }

  private toNonNegativeInteger(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
      ? value
      : null;
  }

  private toPositiveNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : null;
  }

  private toNonNegativeNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : null;
  }
}
