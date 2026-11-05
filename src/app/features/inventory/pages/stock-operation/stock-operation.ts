import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductService } from '../../../products/product.service';
import type { ProductResponse } from '../../../products/product.model';
import { StockOperationService } from '../../services/stock-operation.service';
import type { StockOperationType } from '../../stock-operation.model';
import { ProductTrackingModeLabelPipe } from '../../../../shared/pipes/product-tracking-mode.pipe';

@Component({
  selector: 'app-stock-operation',
  standalone: true,
  imports: [FormsModule, RouterLink, ProductTrackingModeLabelPipe],
  templateUrl: './stock-operation.html',
  styleUrl: './stock-operation.scss',
})
export class StockOperation implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];
  selectedProductId: number | null = null;
  operationType: StockOperationType = 'SALE';
  quantity = 1;
  notes = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const requestedProductId = this.route.snapshot.queryParamMap.get('productId');
    this.loadProducts(requestedProductId);
  }

  get selectedProduct(): ProductResponse | undefined {
    return this.products.find(product => product.id === this.selectedProductId);
  }

  loadProducts(requestedProductId: string | null = null): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.products = products.filter(product => product.status === 'ACTIVE');

          if (requestedProductId !== null) {
            const productId = Number(requestedProductId);
            const productExists = this.products.some(product => product.id === productId);

            if (Number.isSafeInteger(productId) && productId > 0 && productExists) {
              this.selectedProductId = productId;
            }
          }

          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load products.';
          this.isLoading = false;
        },
      });
  }

  onSelectedProductChange(): void {
    this.quantity = 1;
    this.successMessage = '';
    this.errorMessage = '';
  }

  submitOperation(): void {
    if (this.isLoading) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';
    const product = this.selectedProduct;

    if (!product) {
      this.errorMessage = 'Please select a valid product.';
      return;
    }

    if (!Number.isSafeInteger(this.quantity) || this.quantity <= 0) {
      this.errorMessage = 'Enter a valid positive whole number.';
      return;
    }

    this.isLoading = true;
    this.stockOperationService
      .createOperation(
        product.id,
        this.operationType,
        this.quantity,
        this.notes.trim() || null,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: operation => {
          this.successMessage = `Operation saved successfully. New stock: ${operation.newStock}.`;
          this.quantity = 1;
          this.notes = '';
          this.loadProducts(String(product.id));
        },
        error: error => {
          this.errorMessage = error?.message ?? 'Unable to save the operation.';
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
}
