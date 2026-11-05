import type { StockOperationType } from './stock-operation.model';

/**
 * Data sent by the frontend when asking the application to perform a stock movement.
 * The client sends only the information it knows; the data source/API calculates
 * previousStock, newStock, id and createdAt.
 */
export interface CreateStockOperationRequest {
  productId: number;
  type: StockOperationType;
  quantity: number;
  notes: string | null;
}
