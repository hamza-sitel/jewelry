import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import type { ProductResponse } from '../../products/product.model';
import { ProductService } from '../../products/product.service';
import type { StockOperation, StockOperationType } from '../../inventory/stock-operation.model';
import { StockOperationService } from '../../inventory/services/stock-operation.service';

interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface DailyMovement {
  key: string;
  label: string;
  purchase: number;
  sale: number;
  manualAdd: number;
  manualRemove: number;
}

interface OperationMixMetric {
  type: StockOperationType;
  label: string;
  quantity: number;
  percentage: number;
  color: string;
}

interface ChartPoint {
  label: string;
  x: number;
  y: number;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];
  operations: StockOperation[] = [];
  isLoading = false;
  errorMessage = '';

  private readonly chartColors = [
    '#bd806b',
    '#c8ad83',
    '#8795a2',
    '#d5a18f',
    '#927654',
    '#789487',
    '#b5a0ad',
    '#b5a568',
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
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
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load dashboard data. Please try again.';
          this.isLoading = false;
        },
      });
  }

  get activeProducts(): ProductResponse[] {
    return this.products.filter(product => product.status === 'ACTIVE');
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProductsCount(): number {
    return this.activeProducts.length;
  }

  get archivedProductsCount(): number {
    return this.products.filter(product => product.status === 'ARCHIVED').length;
  }

  get totalUnits(): number {
    return this.activeProducts.reduce((total, product) => total + product.quantity, 0);
  }

  /** Low stock means 1–3 pieces, matching the store's chosen threshold. */
  get lowStockCount(): number {
    return this.activeProducts.filter(
      product => product.quantity > 0 && product.quantity <= 3,
    ).length;
  }

  get outOfStockCount(): number {
    return this.activeProducts.filter(product => product.quantity === 0).length;
  }

  get inventoryPurchaseValue(): number {
    return this.activeProducts.reduce(
      (total, product) => total + product.quantity * product.purchasePrice,
      0,
    );
  }

  get inventorySaleValue(): number {
    return this.activeProducts.reduce(
      (total, product) => total + product.quantity * product.salePrice,
      0,
    );
  }

  /** Potential margin on stock still held; it is not realized sales profit. */
  get expectedGrossMargin(): number {
    return this.inventorySaleValue - this.inventoryPurchaseValue;
  }

  get recordedTotalWeight(): number {
    return this.activeProducts.reduce(
      (total, product) => total + (product.weight ?? 0) * product.quantity,
      0,
    );
  }

  get categoryMetrics(): CategoryMetric[] {
    const counts = new Map<string, number>();

    for (const product of this.activeProducts) {
      if (product.quantity <= 0) continue;
      counts.set(
        product.categoryName,
        (counts.get(product.categoryName) ?? 0) + product.quantity,
      );
    }

    const total = this.totalUnits;

    return [...counts.entries()]
      .map(([name, count], index) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: this.chartColors[index % this.chartColors.length],
      }))
      .sort((first, second) => second.count - first.count);
  }

  get categoryChartBackground(): string {
    if (this.totalUnits === 0) return '#eee1d9';

    let start = 0;
    const segments = this.categoryMetrics.map(metric => {
      const end = start + metric.percentage;
      const segment = `${metric.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  get highestCategoryCount(): number {
    return Math.max(1, ...this.categoryMetrics.map(metric => metric.count));
  }

  get weeklyMovement(): DailyMovement[] {
    const days: DailyMovement[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      days.push({
        key: this.toDateKey(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        purchase: 0,
        sale: 0,
        manualAdd: 0,
        manualRemove: 0,
      });
    }

    const byDate = new Map(days.map(day => [day.key, day] as const));

    for (const operation of this.operations) {
      const operationDate = new Date(operation.createdAt);
      if (Number.isNaN(operationDate.getTime())) continue;

      const day = byDate.get(this.toDateKey(operationDate));
      if (!day) continue;

      switch (operation.type) {
        case 'PURCHASE':
          day.purchase += operation.quantity;
          break;
        case 'SALE':
          day.sale += operation.quantity;
          break;
        case 'MANUAL_ADD':
          day.manualAdd += operation.quantity;
          break;
        case 'MANUAL_REMOVE':
          day.manualRemove += operation.quantity;
          break;
      }
    }

    return days;
  }

  get hasWeeklyMovement(): boolean {
    return this.weeklyMovement.some(
      day => day.purchase + day.sale + day.manualAdd + day.manualRemove > 0,
    );
  }

  get weeklyMovementMaximum(): number {
    return Math.max(
      1,
      ...this.weeklyMovement.flatMap(day => [day.purchase, day.sale]),
    );
  }

  get purchasePoints(): ChartPoint[] {
    return this.toChartPoints('purchase');
  }

  get salePoints(): ChartPoint[] {
    return this.toChartPoints('sale');
  }

  get purchaseLinePath(): string {
    return this.toSmoothPath(this.purchasePoints);
  }

  get saleLinePath(): string {
    return this.toSmoothPath(this.salePoints);
  }

  get saleAreaPath(): string {
    const points = this.salePoints;
    if (points.length === 0) return '';
    const line = this.toSmoothPath(points);
    const baseline = 218;
    return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }

  get operationMix(): OperationMixMetric[] {
    const definitions: Array<{ type: StockOperationType; label: string; color: string }> = [
      { type: 'PURCHASE', label: 'Purchases', color: '#81988a' },
      { type: 'SALE', label: 'Sales', color: '#bd806b' },
      { type: 'MANUAL_ADD', label: 'Manual additions', color: '#c8ad83' },
      { type: 'MANUAL_REMOVE', label: 'Manual removals', color: '#8795a2' },
    ];

    const counts = definitions.map(definition => ({
      ...definition,
      quantity: this.operations
        .filter(operation => operation.type === definition.type)
        .reduce((total, operation) => total + operation.quantity, 0),
    }));
    const total = counts.reduce((sum, item) => sum + item.quantity, 0);

    return counts.map(item => ({
      ...item,
      percentage: total > 0 ? (item.quantity / total) * 100 : 0,
    }));
  }

  get hasOperationMix(): boolean {
    return this.operationMix.some(item => item.quantity > 0);
  }

  get recentOperations(): StockOperation[] {
    return [...this.operations]
      .sort((first, second) => this.timestamp(second.createdAt) - this.timestamp(first.createdAt))
      .slice(0, 6);
  }

  get recentProducts(): ProductResponse[] {
    return [...this.products]
      .filter(product => product.status === 'ACTIVE')
      .sort((first, second) => this.timestamp(second.createdAt) - this.timestamp(first.createdAt))
      .slice(0, 5);
  }

  formatPrice(value: number): string {
    return `${value.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DH`;
  }

  formatWeight(value: number): string {
    return `${value.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })} g`;
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

  private toChartPoints(kind: 'purchase' | 'sale'): ChartPoint[] {
    const baseline = 218;
    const top = 30;
    const left = 48;
    const right = 608;
    const days = this.weeklyMovement;
    const max = this.weeklyMovementMaximum;
    const xStep = days.length > 1 ? (right - left) / (days.length - 1) : 0;

    return days.map((day, index) => {
      const value = day[kind];
      const y = baseline - (value / max) * (baseline - top);
      return { label: day.label, x: left + index * xStep, y, value };
    });
  }

  private toSmoothPath(points: ChartPoint[]): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const middleX = (previous.x + current.x) / 2;
      path += ` C ${middleX} ${previous.y}, ${middleX} ${current.y}, ${current.x} ${current.y}`;
    }
    return path;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private timestamp(value: string): number {
    const result = new Date(value).getTime();
    return Number.isFinite(result) ? result : 0;
  }
}
