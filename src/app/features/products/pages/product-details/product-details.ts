
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductService } from '../../product.service';
import type { ProductResponse } from '../../product.model';

import { StockOperationService } from '../../../inventory/services/stock-operation.service';
import type { StockOperation } from '../../../inventory/stock-operation.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  product: ProductResponse | null = null;
  operations: StockOperation[] = [];

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(productId) || productId <= 0) {
      this.errorMessage = 'Invalid product ID.';
      this.isLoading = false;
      return;
    }

    this.loadProduct(productId);
  }

  private loadProduct(productId: number): void {
    this.productService
      .getProductById(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          this.product = product ?? null;

          if (!product) {
            this.errorMessage = 'Product not found.';
            this.isLoading = false;
            return;
          }

          this.loadOperations(productId);
        },
        error: () => {
          this.errorMessage = 'Unable to load product details.';
          this.isLoading = false;
        },
      });
  }

  private loadOperations(productId: number): void {
    this.stockOperationService
      .getOperationsByProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: operations => {
          this.operations = operations;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load stock history.';
          this.isLoading = false;
        },
      });
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DH`;
  }

  formatWeight(weight: number | null): string {
    if (weight === null) {
      return 'Not specified';
    }

    return `${weight.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })} g`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
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
  get totalPurchaseValue(): number {
  if (!this.product) return 0;

  return this.product.quantity * this.product.purchasePrice;
}

get totalSalesValue(): number {
  if (!this.product) return 0;

  return this.product.quantity * this.product.salePrice;
}

get expectedGrossProfit(): number {
  return this.totalSalesValue - this.totalPurchaseValue;
}
}
