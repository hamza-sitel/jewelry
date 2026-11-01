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

@Injectable()
export class MockProductDataSource implements ProductDataSource {
  private readonly catalog = inject(ProductCatalogService);

  private nextId =
    Math.max(0, ...MOCK_PRODUCTS.map(product => product.id)) + 1;

  getAll(): Observable<ProductResponse[]> {
    return of(MOCK_PRODUCTS.map(product => this.withCurrentNames(product)));
  }

  getById(id: number): Observable<ProductResponse | undefined> {
    const product = MOCK_PRODUCTS.find(item => item.id === id);

    return of(product ? this.withCurrentNames(product) : undefined);
  }

  create(request: CreateProductRequest): Observable<ProductResponse> {
    const product: ProductResponse = {
      id: this.nextId++,
      barcode: `JWL${String(this.nextId - 1).padStart(6, '0')}`,
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

    MOCK_PRODUCTS.push(product);

    return of(this.withCurrentNames(product));
  }

  update(
    id: number,
    request: UpdateProductRequest,
  ): Observable<ProductResponse | undefined> {
    const product = MOCK_PRODUCTS.find(item => item.id === id);

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
    return of(this.withCurrentNames(product));
  }
  archive(id: number): Observable<ProductResponse | undefined> {
  const product = MOCK_PRODUCTS.find(item => item.id === id);

  if (!product) {
    return of(undefined);
  }

  product.status = 'ARCHIVED';

  return of(this.withCurrentNames(product));
}

restore(id: number): Observable<ProductResponse | undefined> {
  const product = MOCK_PRODUCTS.find(item => item.id === id);

  if (!product) {
    return of(undefined);
  }

  product.status = 'ACTIVE';

  return of(this.withCurrentNames(product));
}

  private withCurrentNames(product: ProductResponse): ProductResponse {
    return {
      ...product,
      categoryName: this.catalog.getCategoryName(product.categoryId),
      typeName: this.catalog.getTypeName(product.typeId),
    };
  }
}