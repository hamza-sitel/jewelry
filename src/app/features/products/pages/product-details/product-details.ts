import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductService } from '../../product.service';
import type { ProductResponse } from '../../product.model';
import { StockOperationService } from '../../../inventory/services/stock-operation.service';
import type { StockOperation } from '../../../inventory/stock-operation.model';
import { ProductTrackingModeLabelPipe } from '../../../../shared/pipes/product-tracking-mode.pipe';
import { DEFAULT_PAGE_SIZE, Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, ProductTrackingModeLabelPipe, Pagination],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  product: ProductResponse | null = null;
  isUpdatingStatus = false;
  operations: StockOperation[] = [];
  readonly pageSize = DEFAULT_PAGE_SIZE;
  currentOperationPage = 1;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isSafeInteger(productId) || productId <= 0) {
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
          this.currentOperationPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load stock history.';
          this.isLoading = false;
        },
      });
  }

  get paginatedOperations(): StockOperation[] {
    const startIndex = (this.currentOperationPage - 1) * this.pageSize;
    return this.operations.slice(startIndex, startIndex + this.pageSize);
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

  archiveProduct(): void {
    if (!this.product || this.isUpdatingStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    this.productService
      .archiveProduct(this.product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          if (product) {
            this.product = product;
          }
          this.isUpdatingStatus = false;
        },
        error: () => {
          this.errorMessage = 'Unable to archive product.';
          this.isUpdatingStatus = false;
        },
      });
  }

  restoreProduct(): void {
    if (!this.product || this.isUpdatingStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    this.productService
      .restoreProduct(this.product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          if (product) {
            this.product = product;
          }
          this.isUpdatingStatus = false;
        },
        error: () => {
          this.errorMessage = 'Unable to restore product.';
          this.isUpdatingStatus = false;
        },
      });
  }

  get totalPurchaseValue(): number {
    return this.product ? this.product.quantity * this.product.purchasePrice : 0;
  }

  get totalSalesValue(): number {
    return this.product ? this.product.quantity * this.product.salePrice : 0;
  }

  get expectedGrossProfit(): number {
    return this.totalSalesValue - this.totalPurchaseValue;
  }
}
