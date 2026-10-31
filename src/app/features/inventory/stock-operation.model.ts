
export type StockOperationType =
  | 'PURCHASE'
  | 'SALE'
  | 'MANUAL_ADD'
  | 'MANUAL_REMOVE';

export interface StockOperation {
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
