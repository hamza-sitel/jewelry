
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';

import type { ProductResponse } from '../../products/product.model';
import { ProductService } from '../../products/product.service';

interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];

  isLoading = false;
  errorMessage = '';

  private readonly chartColors = [
    '#c27d66',
    '#c5a880',
    '#8e97a4',
    '#d48b78',
    '#9a7b4f',
    '#7a9b83',
    '#b6a0b5',
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.products = products;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load dashboard data.';
          this.isLoading = false;
        },
      });
  }

  // Product records include both active and archived products.
  get totalProducts(): number {
    return this.products.length;
  }

  // Only active products participate in normal inventory calculations.
  get activeProducts(): ProductResponse[] {
    return this.products.filter(product => product.status === 'ACTIVE');
  }

  get activeProductsCount(): number {
    return this.activeProducts.length;
  }

  get archivedProductsCount(): number {
    return this.products.filter(
      product => product.status === 'ARCHIVED',
    ).length;
  }

  get totalUnits(): number {
    return this.activeProducts.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );
  }

  // Counts product records with 1–3 pieces, not individual pieces.
  get lowStockCount(): number {
    return this.activeProducts.filter(
      product => product.quantity > 0 && product.quantity <= 3,
    ).length;
  }

  // Counts active product records whose quantity is zero.
  get outOfStockCount(): number {
    return this.activeProducts.filter(
      product => product.quantity === 0,
    ).length;
  }

  get inventoryPurchaseValue(): number {
    return this.activeProducts.reduce(
      (sum, product) =>
        sum + product.quantity * product.purchasePrice,
      0,
    );
  }

  get inventorySaleValue(): number {
    return this.activeProducts.reduce(
      (sum, product) =>
        sum + product.quantity * product.salePrice,
      0,
    );
  }

  // Potential margin on the stock currently held.
  // This is not profit already earned from completed sales.
  get expectedGrossProfit(): number {
    return this.inventorySaleValue - this.inventoryPurchaseValue;
  }

  get recordedTotalWeight(): number {
    return this.activeProducts.reduce(
      (sum, product) =>
        sum +
        (product.weight === null
          ? 0
          : product.weight * product.quantity),
      0,
    );
  }
// ! 
  get categoryMetrics(): CategoryMetric[] {
    const counts = new Map<string, number>();

    for (const product of this.activeProducts) {
      if (product.quantity <= 0) {
        continue;
      }

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
      .sort((a, b) => b.count - a.count);
  }

  get categoryChartBackground(): string {
    if (this.totalUnits === 0) {
      return '#f0dfd8';
    }

    let currentPercentage = 0;

    const segments = this.categoryMetrics.map(metric => {
      const start = currentPercentage;
      currentPercentage += metric.percentage;

      return `${metric.color} ${start}% ${currentPercentage}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  get highestCategoryCount(): number {
    return Math.max(
      1,
      ...this.categoryMetrics.map(metric => metric.count),
    );
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
}
