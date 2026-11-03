import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ProductService } from '../products/product.service';
import type { ProductResponse } from '../products/product.model';

import { StockOperationService } from '../inventory/services/stock-operation.service';
import type { StockOperation } from '../inventory/stock-operation.model';

import {
  ReportExportService,
  type ExportRow,
} from './report-export.service';

type ReportTab = 'STOCK' | 'OPERATIONS';
type ProductStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
    reloadReports(): void {
        this.loadReports();
    }
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly exportService = inject(ReportExportService);

  products: ProductResponse[] = [];
  operations: StockOperation[] = [];

  activeTab: ReportTab = 'STOCK';

  isLoading = true;
  errorMessage = '';

  // Stock report filters
  stockSearch = '';
  selectedCategory = 'ALL';
  selectedProductStatus: ProductStatusFilter = 'ACTIVE';

  // Operation report filters
  operationSearch = '';
  selectedOperationType = 'ALL';
  dateFrom = '';
  dateTo = '';

  ngOnInit(): void {
    this.loadReports();
  }

  private loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      products: this.productService.getProducts(),
      operations: this.stockOperationService.getOperations(),
    }).subscribe({
      next: ({ products, operations }) => {
        this.products = products;
        this.operations = operations;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load reports. Please try again.';
        this.isLoading = false;
      },
    });
  }

  // -------------------------
  // Shared data
  // -------------------------

  get categoryOptions(): string[] {
    return [
      ...new Set(
        this.products.map(product => product.categoryName),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }

  // -------------------------
  // Stock report
  // -------------------------

  get filteredStockProducts(): ProductResponse[] {
    const search = this.stockSearch.trim().toLowerCase();

    return this.products.filter(product => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.barcode.toLowerCase().includes(search) ||
        product.categoryName.toLowerCase().includes(search) ||
        product.typeName.toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        product.categoryName === this.selectedCategory;

      const matchesStatus =
        this.selectedProductStatus === 'ALL' ||
        product.status === this.selectedProductStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  get totalProducts(): number {
    return this.filteredStockProducts.length;
  }

  get totalUnits(): number {
    return this.filteredStockProducts.reduce(
      (total, product) => total + product.quantity,
      0,
    );
  }

  get totalWeight(): number {
    return this.filteredStockProducts.reduce(
      (total, product) =>
        total + (product.weight ?? 0) * product.quantity,
      0,
    );
  }

  get totalPurchaseValue(): number {
    return this.filteredStockProducts.reduce(
      (total, product) =>
        total + product.quantity * product.purchasePrice,
      0,
    );
  }

  get totalSaleValue(): number {
    return this.filteredStockProducts.reduce(
      (total, product) =>
        total + product.quantity * product.salePrice,
      0,
    );
  }

  get expectedGrossProfit(): number {
    return this.totalSaleValue - this.totalPurchaseValue;
  }

  clearStockFilters(): void {
    this.stockSearch = '';
    this.selectedCategory = 'ALL';
    this.selectedProductStatus = 'ACTIVE';
  }

  // -------------------------
  // Operation report
  // -------------------------

  get filteredOperations(): StockOperation[] {
    const search = this.operationSearch.trim().toLowerCase();

    return this.operations.filter(operation => {
      const matchesSearch =
        !search ||
        operation.productName.toLowerCase().includes(search) ||
        operation.barcode.toLowerCase().includes(search) ||
        (operation.notes ?? '').toLowerCase().includes(search);

      const matchesType =
        this.selectedOperationType === 'ALL' ||
        operation.type === this.selectedOperationType;

      const operationDate = operation.createdAt.slice(0, 10);

      const matchesStartDate =
        !this.dateFrom || operationDate >= this.dateFrom;

      const matchesEndDate =
        !this.dateTo || operationDate <= this.dateTo;

      return (
        matchesSearch &&
        matchesType &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }

  get totalOperations(): number {
    return this.filteredOperations.length;
  }

  get totalOperationQuantity(): number {
    return this.filteredOperations.reduce(
      (total, operation) => total + operation.quantity,
      0,
    );
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

  private sumOperationsByType(
    type: StockOperation['type'],
  ): number {
    return this.filteredOperations
      .filter(operation => operation.type === type)
      .reduce((total, operation) => total + operation.quantity, 0);
  }

  clearOperationFilters(): void {
    this.operationSearch = '';
    this.selectedOperationType = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
  }

  // -------------------------
  // Formatting
  // -------------------------

  formatPrice(value: number): string {
    return `${value.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DH`;
  }

  formatWeight(product: ProductResponse): string {
    if (product.weight === null) {
      return '—';
    }

    return `${product.weight.toFixed(2)} g`;
  }

  formatTotalWeight(product: ProductResponse): string {
    if (product.weight === null) {
      return '—';
    }

    return `${(product.weight * product.quantity).toFixed(2)} g`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('fr-MA');
  }

  getOperationLabel(type: StockOperation['type']): string {
    const labels: Record<StockOperation['type'], string> = {
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

  // -------------------------
  // Export
  // -------------------------

  private getStockExportRows(): ExportRow[] {
    return this.filteredStockProducts.map(product => ({
      Product: product.name,
      Barcode: product.barcode,
      Category: product.categoryName,
      Type: product.typeName,
      Tracking: product.trackingMode,
      Quantity: product.quantity,
      'Weight per piece (g)': product.weight,
      'Total weight (g)':
        product.weight === null
          ? null
          : product.weight * product.quantity,
      'Purchase price (DH)': product.purchasePrice,
      'Sale price (DH)': product.salePrice,
      'Purchase value (DH)':
        product.quantity * product.purchasePrice,
      'Sale value (DH)': product.quantity * product.salePrice,
      Status: product.status,
    }));
  }

  private getOperationExportRows(): ExportRow[] {
    return this.filteredOperations.map(operation => ({
      Date: this.formatDate(operation.createdAt),
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
    this.exportService.exportCsv(
      'jewelry-stock-report.csv',
      this.getStockExportRows(),
    );
  }

  downloadOperationsCsv(): void {
    this.exportService.exportCsv(
      'jewelry-operation-report.csv',
      this.getOperationExportRows(),
    );
  }

  downloadExcel(): void {
    this.exportService.exportExcel(
      this.getStockExportRows(),
      this.getOperationExportRows(),
      'jewelry-reports.xlsx',
    );
  }

  setActiveTab(tab: ReportTab): void {
    this.activeTab = tab;
  }
}