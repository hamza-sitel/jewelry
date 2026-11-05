/** Operations are always recorded in whole pieces, never in grams. */
export type StockOperationType =
  | 'PURCHASE'
  | 'SALE'
  | 'MANUAL_ADD'
  | 'MANUAL_REMOVE';

/**
 * Data returned after a stock movement has been accepted and recorded.
 * previousStock and newStock are calculated by the mock/API, not by the page.
 */
export interface StockOperationResponse {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  type: StockOperationType;
  quantity: number;
  previousStock: number;
  newStock: number;
  createdAt: string;
  notes: string | null;
}

/** Backwards-compatible read-model name used by Reports and Product Details. */
export type StockOperation = StockOperationResponse;
