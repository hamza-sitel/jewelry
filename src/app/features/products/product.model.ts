/**
 * Product and catalog contracts shared by Angular pages and data sources.
 * These are transfer models, not database entities.
 */

/**
 * PIECE: inventory is counted by pieces and weight is always null.
 * WEIGHTED: a per-piece weight is recorded; quantity can still be any
 * positive whole number because the pieces share the same per-piece weight.
 */
export type ProductTrackingMode = 'PIECE' | 'WEIGHTED';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProductCategoryResponse {
  id: number;
  name: string;
}

export type ProductCategory = ProductCategoryResponse;

export interface ProductTypeResponse {
  id: number;
  categoryId: number;
  name: string;
}

export type ProductType = ProductTypeResponse;

export interface ProductCatalogSnapshot {
  categories: ProductCategoryResponse[];
  types: ProductTypeResponse[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface CreateProductTypeRequest {
  categoryId: number;
  name: string;
}

export interface UpdateProductTypeRequest {
  name: string;
}

/** Fields that can be changed without changing a product's tracking mode or stock. */
export interface ProductDetailsRequest {
  name: string;
  categoryId: number;
  typeId: number;
  weight: number | null;
  purchasePrice: number;
  salePrice: number;
  imageUrl: string | null;
}

/** Initial stock quantity is supplied when creating a product for either tracking mode. */
export interface CreateProductRequest extends ProductDetailsRequest {
  trackingMode: ProductTrackingMode;
  quantity: number;
}

/** Tracking mode and quantity cannot be altered through the product-edit form. */
export type UpdateProductRequest = ProductDetailsRequest;

/** Read model: includes values generated or owned by the application/API. */
export interface ProductResponse extends CreateProductRequest {
  id: number;
  barcode: string;
  categoryName: string;
  typeName: string;
  status: ProductStatus;
  createdAt: string;
}
