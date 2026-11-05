import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { Pagination } from '../../shared/components/pagination/pagination';
import { ProductService } from '../products/product.service';
import type { ProductResponse } from '../products/product.model';
import { StockOperationService } from '../inventory/services/stock-operation.service';
import type { StockOperation, StockOperationType } from '../inventory/stock-operation.model';
import { ReportExportService, type ExportRow } from './report-export.service';

type ReportTab = 'STOCK' | 'OPERATIONS';
type ProductStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';
type StockSort = 'NAME_ASC' | 'QUANTITY_DESC' | 'PURCHASE_VALUE_DESC';
type OperationSort = 'NEWEST_FIRST' | 'OLDEST_FIRST' | 'QUANTITY_DESC';

interface CategoryShare {
  name: string;
  quantity: number;
  percentage: number;
  purchaseValue: number;
  valuePercentage: number;
  color: string;
}

interface OperationShare {
  type: StockOperationType;
  label: string;
  quantity: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, Pagination],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly exportService = inject(ReportExportService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];
  operations: StockOperation[] = [];

  activeTab: ReportTab = 'STOCK';
  isLoading = true;
  errorMessage = '';

  readonly pageSize = 20;
  stockPage = 1;
  operationsPage = 1;

  stockSearch = '';
  selectedCategory = 'ALL';
  selectedProductStatus: ProductStatusFilter = 'ACTIVE';
  stockSort: StockSort = 'NAME_ASC';

  operationSearch = '';
  selectedOperationType: StockOperationType | 'ALL' = 'ALL';
  dateFrom = '';
  dateTo = '';
  operationSort: OperationSort = 'NEWEST_FIRST';

  ngOnInit(): void {
    this.loadReports();
  }

  reloadReports(): void {
    this.loadReports();
  }

  private loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      products: this.productService.getProducts(),
      operations: this.stockOperationService.getOperations(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ products, operations }) => {
          this.products = products;
          this.operations = operations;
          this.stockPage = 1;
          this.operationsPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load reports. Please try again.';
          this.isLoading = false;
        },
      });
  }

  get categoryOptions(): string[] {
    return [...new Set(this.products.map(product => product.categoryName))]
      .sort((first, second) => first.localeCompare(second));
  }

  get filteredStockProducts(): ProductResponse[] {
    const search = this.stockSearch.trim().toLowerCase();
    const matching = this.products.filter(product => {
      const matchesSearch = !search || [
        product.name,
        product.barcode,
        product.categoryName,
        product.typeName,
      ].some(value => value.toLowerCase().includes(search));
      const matchesCategory = this.selectedCategory === 'ALL'
        || product.categoryName === this.selectedCategory;
      const matchesStatus = this.selectedProductStatus === 'ALL'
        || product.status === this.selectedProductStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return matching.sort((first, second) => {
      switch (this.stockSort) {
        case 'QUANTITY_DESC':
          return second.quantity - first.quantity || first.name.localeCompare(second.name);
        case 'PURCHASE_VALUE_DESC':
          return (second.quantity * second.purchasePrice)
            - (first.quantity * first.purchasePrice)
            || first.name.localeCompare(second.name);
        case 'NAME_ASC':
        default:
          return first.name.localeCompare(second.name);
      }
    });
  }

  get paginatedStockProducts(): ProductResponse[] {
    const start = (this.stockPage - 1) * this.pageSize;
    return this.filteredStockProducts.slice(start, start + this.pageSize);
  }

  get totalProducts(): number {
    return this.filteredStockProducts.length;
  }

  get totalUnits(): number {
    return this.filteredStockProducts.reduce((total, product) => total + product.quantity, 0);
  }

  get totalWeight(): number {
    return this.filteredStockProducts.reduce(
      (total, product) => total + (product.weight ?? 0) * product.quantity,
      0,
    );
  }

  get totalPurchaseValue(): number {
    return this.filteredStockProducts.reduce(
      (total, product) => total + product.quantity * product.purchasePrice,
      0,
    );
  }

  get totalSaleValue(): number {
    return this.filteredStockProducts.reduce(
      (total, product) => total + product.quantity * product.salePrice,
      0,
    );
  }

  get expectedGrossMargin(): number {
    return this.totalSaleValue - this.totalPurchaseValue;
  }

  get categoryShares(): CategoryShare[] {
    const totals = new Map<string, { quantity: number; purchaseValue: number }>();
    for (const product of this.filteredStockProducts) {
      if (product.quantity <= 0) continue;
      const current = totals.get(product.categoryName) ?? { quantity: 0, purchaseValue: 0 };
      current.quantity += product.quantity;
      current.purchaseValue += product.quantity * product.purchasePrice;
      totals.set(product.categoryName, current);
    }

    const totalQuantity = [...totals.values()].reduce((sum, value) => sum + value.quantity, 0);
    const totalPurchaseValue = [...totals.values()].reduce((sum, value) => sum + value.purchaseValue, 0);
    const colors = ['#bd806b', '#c8ad83', '#8795a2', '#789487', '#b5a0ad', '#9b7959', '#c6a36d'];

    return [...totals.entries()]
      .map(([name, value], index) => ({
        name,
        quantity: value.quantity,
        percentage: totalQuantity > 0 ? value.quantity / totalQuantity * 100 : 0,
        purchaseValue: value.purchaseValue,
        valuePercentage: totalPurchaseValue > 0 ? value.purchaseValue / totalPurchaseValue * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((first, second) => second.quantity - first.quantity);
  }

  get categoryChartBackground(): string {
    if (this.categoryShares.length === 0) return '#eee1d9';
    let start = 0;
    const segments = this.categoryShares.map(item => {
      const end = start + item.percentage;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  clearStockFilters(): void {
    this.stockSearch = '';
    this.selectedCategory = 'ALL';
    this.selectedProductStatus = 'ACTIVE';
    this.stockSort = 'NAME_ASC';
    this.stockPage = 1;
  }

  get filteredOperations(): StockOperation[] {
    const search = this.operationSearch.trim().toLowerCase();
    const matching = this.operations.filter(operation => {
      const matchesSearch = !search || [
        operation.productName,
        operation.barcode,
        operation.notes ?? '',
        String(operation.productId),
      ].some(value => value.toLowerCase().includes(search));
      const matchesType = this.selectedOperationType === 'ALL'
        || operation.type === this.selectedOperationType;
      const operationDate = this.toDateKey(new Date(operation.createdAt));
      const matchesStart = !this.dateFrom || operationDate >= this.dateFrom;
      const matchesEnd = !this.dateTo || operationDate <= this.dateTo;
      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });

    return matching.sort((first, second) => {
      switch (this.operationSort) {
        case 'OLDEST_FIRST':
          return this.timestamp(first.createdAt) - this.timestamp(second.createdAt);
        case 'QUANTITY_DESC':
          return second.quantity - first.quantity
            || this.timestamp(second.createdAt) - this.timestamp(first.createdAt);
        case 'NEWEST_FIRST':
        default:
          return this.timestamp(second.createdAt) - this.timestamp(first.createdAt);
      }
    });
  }

  get paginatedOperations(): StockOperation[] {
    const start = (this.operationsPage - 1) * this.pageSize;
    return this.filteredOperations.slice(start, start + this.pageSize);
  }

  get totalOperations(): number {
    return this.filteredOperations.length;
  }

  get totalOperationQuantity(): number {
    return this.filteredOperations.reduce((total, operation) => total + operation.quantity, 0);
  }

  get totalSalesQuantity(): number {
    return this.sumOperationsByType('SALE');
  }

  get totalPurchasesQuantity(): number {
    return this.sumOperationsByType('PURCHASE');
  }

  get totalManualAdditions(): number {
    return this.sumOperationsByType('MANUAL_ADD');
  }

  get totalManualRemovals(): number {
    return this.sumOperationsByType('MANUAL_REMOVE');
  }

  get operationShares(): OperationShare[] {
    const definitions: Array<{ type: StockOperationType; label: string; color: string }> = [
      { type: 'PURCHASE', label: 'Purchases', color: '#789487' },
      { type: 'SALE', label: 'Sales', color: '#bd806b' },
      { type: 'MANUAL_ADD', label: 'Manual additions', color: '#c8ad83' },
      { type: 'MANUAL_REMOVE', label: 'Manual removals', color: '#8795a2' },
    ];
    const quantities = definitions.map(definition => ({
      ...definition,
      quantity: this.filteredOperations
        .filter(operation => operation.type === definition.type)
        .reduce((sum, operation) => sum + operation.quantity, 0),
    }));
    const total = quantities.reduce((sum, item) => sum + item.quantity, 0);
    return quantities.map(item => ({
      ...item,
      percentage: total > 0 ? item.quantity / total * 100 : 0,
    }));
  }

  private sumOperationsByType(type: StockOperationType): number {
    return this.filteredOperations
      .filter(operation => operation.type === type)
      .reduce((total, operation) => total + operation.quantity, 0);
  }

  clearOperationFilters(): void {
    this.operationSearch = '';
    this.selectedOperationType = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
    this.operationSort = 'NEWEST_FIRST';
    this.operationsPage = 1;
  }

  formatPrice(value: number): string {
    return `${value.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DH`;
  }

  formatWeight(product: ProductResponse): string {
    return product.weight === null ? '—' : `${product.weight.toFixed(3)} g`;
  }

  formatTotalWeight(product: ProductResponse): string {
    return product.weight === null
      ? '—'
      : `${(product.weight * product.quantity).toFixed(3)} g`;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-MA');
  }

  getOperationLabel(type: StockOperationType): string {
    const labels: Record<StockOperationType, string> = {
      PURCHASE: 'Purchase',
      SALE: 'Sale',
      MANUAL_ADD: 'Manual addition',
      MANUAL_REMOVE: 'Manual removal',
    };
    return labels[type];
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'Out of stock';
    if (quantity <= 3) return 'Low stock';
    return 'In stock';
  }

  setStockPage(page: number): void {
    this.stockPage = page;
  }

  setOperationsPage(page: number): void {
    this.operationsPage = page;
  }

  setActiveTab(tab: ReportTab): void {
    this.activeTab = tab;
  }

  private toDateKey(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private timestamp(value: string): number {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private getStockExportRows(): ExportRow[] {
    return this.filteredStockProducts.map(product => ({
      Product: product.name,
      Barcode: product.barcode,
      Category: product.categoryName,
      Type: product.typeName,
      Tracking: product.trackingMode === 'WEIGHTED' ? 'Weighted (per piece)' : 'Piece-based (no weight)',
      Quantity: product.quantity,
      'Weight per piece (g)': product.weight,
      'Total weight (g)': product.weight === null ? null : product.weight * product.quantity,
      'Purchase price (DH)': product.purchasePrice,
      'Sale price (DH)': product.salePrice,
      'Purchase value (DH)': product.quantity * product.purchasePrice,
      'Potential sale value (DH)': product.quantity * product.salePrice,
      'Stock status': this.getStockStatus(product.quantity),
      'Product status': product.status,
    }));
  }

  private getOperationExportRows(): ExportRow[] {
    return this.filteredOperations.map(operation => ({
      Date: this.formatDate(operation.createdAt),
      'Product ID': operation.productId,
      Product: operation.productName,
      Barcode: operation.barcode,
      Operation: this.getOperationLabel(operation.type),
      Quantity: operation.quantity,
      'Previous stock': operation.previousStock,
      'New stock': operation.newStock,
      Notes: operation.notes,
    }));
  }

  downloadStockCsv(): void {
    this.exportService.exportCsv('jewelry-stock-report.csv', this.getStockExportRows());
  }

  downloadOperationsCsv(): void {
    this.exportService.exportCsv('jewelry-operation-report.csv', this.getOperationExportRows());
  }

  downloadExcel(): void {
    this.exportService.exportExcel(
      this.getStockExportRows(),
      this.getOperationExportRows(),
      'jewelry-reports.xlsx',
    );
  }
}
