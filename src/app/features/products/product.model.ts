export type ProductTrackingMode = 'INDIVIDUAL' | 'QUANTITY';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductType {
  id: number;
  categoryId: number;
  name: string;
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  typeId: number;
  trackingMode: ProductTrackingMode;
  weight: number | null;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  imageUrl: string | null;
}

export interface UpdateProductRequest extends CreateProductRequest {}

export interface ProductResponse extends CreateProductRequest {
  id: number;
  barcode: string;
  categoryName: string;
  typeName: string;
  status: ProductStatus;
  createdAt: string;
}