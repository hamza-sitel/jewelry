import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { ProductResponse } from '../products/product.model';
import { ProductService } from '../products/product.service';
import { StockOperationService } from '../inventory/services/stock-operation.service';
import { FeedbackMessage } from '../../shared/components/feedback-message/feedback-message';

@Component({
  selector: 'app-sales-workspace',
  standalone: true,
  imports: [FormsModule, FeedbackMessage],
  templateUrl: './sales-workspace.html',
  styleUrl: './sales-workspace.scss',
})
export class SalesWorkspace implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];
  searchTerm = '';
  selectedProductId: number | null = null;
  quantity = 1;
  notes = '';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  get activeProducts(): ProductResponse[] {
    return this.products.filter(product => product.status === 'ACTIVE');
  }

  get filteredProducts(): ProductResponse[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    if (!query) return this.activeProducts;
    return this.activeProducts.filter(product =>
      product.name.toLocaleLowerCase().includes(query) ||
      product.barcode.toLocaleLowerCase().includes(query) ||
      product.categoryName.toLocaleLowerCase().includes(query),
    );
  }

  get selectedProduct(): ProductResponse | undefined {
    return this.products.find(product => product.id === this.selectedProductId && product.status === 'ACTIVE');
  }

  get isSaleQuantityValid(): boolean {
    return Number.isSafeInteger(this.quantity) && this.quantity >= 1 &&
      !!this.selectedProduct && this.quantity <= this.selectedProduct.quantity;
  }

  selectProduct(product: ProductResponse): void {
    this.selectedProductId = product.id;
    this.quantity = 1;
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitSale(): void {
    const product = this.selectedProduct;
    if (!product || this.isSaving) return;
    if (!Number.isSafeInteger(this.quantity) || this.quantity < 1) {
      this.errorMessage = 'Enter a positive whole-number quantity.';
      return;
    }
    if (this.quantity > product.quantity) {
      this.errorMessage = `Only ${product.quantity} piece(s) are currently available.`;
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.stockOperationService.createOperation({
      productId: product.id,
      type: 'SALE',
      quantity: this.quantity,
      notes: this.notes.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: operation => {
          this.products = this.products.map(item =>
            item.id === operation.productId ? { ...item, quantity: operation.newStock } : item,
          );
          this.successMessage = `${operation.quantity} piece(s) sold. ${operation.newStock} piece(s) remain in stock.`;
          this.quantity = 1;
          this.notes = '';
          this.isSaving = false;
        },
        error: error => {
          this.errorMessage = error instanceof Error ? error.message : 'The sale could not be recorded.';
          this.isSaving = false;
        },
      });
  }

  formatPrice(value: number): string {
    return `${value.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
  }

  formatWeight(value: number): string {
    return `${value.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} g`;
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.products = products;
          this.isLoading = false;
        },
        error: error => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to load products.';
          this.isLoading = false;
        },
      });
  }
}
