
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './product.model';

import { MOCK_PRODUCTS } from './product.mock';
import { ProductCatalogService } from './product-catalog.service';
import type { ProductDataSource } from './product-data-source';

import { BrowserStorageService } from '../../core/services/browser-storage.service';

@Injectable()
export class MockProductDataSource implements ProductDataSource {
  private readonly catalog = inject(ProductCatalogService);
  private readonly storage = inject(BrowserStorageService);

  private readonly storageKey = 'jewelry-stock.products';

  private products: ProductResponse[];

  constructor() {
    const savedProducts = this.storage.get<ProductResponse[] | null>(
      this.storageKey,
      null,
    );

    this.products = savedProducts ?? MOCK_PRODUCTS.map(product => ({
      ...product,
    }));

    // Initialize browser storage with the mock products only once.
    if (savedProducts === null) {
      this.saveProducts();
    }
  }

  getAll(): Observable<ProductResponse[]> {
    return of(
      this.products.map(product => this.withCurrentNames(product)),
    );
  }

  getById(id: number): Observable<ProductResponse | undefined> {
    const product = this.products.find(item => item.id === id);

    return of(
      product ? this.withCurrentNames(product) : undefined,
    );
  }

  create(request: CreateProductRequest): Observable<ProductResponse> {
    const id = this.getNextId();

    const product: ProductResponse = {
      id,
      barcode: `JWL${String(id).padStart(6, '0')}`,
      name: request.name.trim(),
      categoryId: request.categoryId,
      categoryName: this.catalog.getCategoryName(request.categoryId),
      typeId: request.typeId,
      typeName: this.catalog.getTypeName(request.typeId),
      trackingMode: request.trackingMode,
      weight: request.weight,
      quantity: request.quantity,
      purchasePrice: request.purchasePrice,
      salePrice: request.salePrice,
      status: 'ACTIVE',
      imageUrl: request.imageUrl,
      createdAt: new Date().toISOString(),
    };

    this.products.push(product);
    this.saveProducts();

    return of(this.withCurrentNames(product));
  }

  update(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined> {
    const product = this.products.find(item => item.id === id);

    if (!product) {
      return of(undefined);
    }

    product.name = request.name.trim();
    product.categoryId = request.categoryId;
    product.categoryName = this.catalog.getCategoryName(request.categoryId);
    product.typeId = request.typeId;
    product.typeName = this.catalog.getTypeName(request.typeId);
    product.trackingMode = request.trackingMode;
    product.weight = request.weight;
    product.quantity = request.quantity;
    product.purchasePrice = request.purchasePrice;
    product.salePrice = request.salePrice;
    product.imageUrl = request.imageUrl;

    // The product ID, barcode and creation date remain unchanged.
    this.saveProducts();

    return of(this.withCurrentNames(product));
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
    const product = this.products.find(item => item.id === id);

    if (!product) {
      return of(undefined);
    }

    product.status = status;
    this.saveProducts();

    return of(this.withCurrentNames(product));
  }

  private getNextId(): number {
    return Math.max(
      0,
      ...this.products.map(product => product.id),
    ) + 1;
  }

  private saveProducts(): void {
    this.storage.set(this.storageKey, this.products);
  }

  private withCurrentNames(product: ProductResponse): ProductResponse {
    return {
      ...product,
      categoryName: this.catalog.getCategoryName(product.categoryId),
      typeName: this.catalog.getTypeName(product.typeId),
    };
  }
}
