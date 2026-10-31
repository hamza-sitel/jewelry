
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../../products/product.service';
import type { ProductResponse } from '../../../products/product.model';

import { StockOperationService } from '../../services/stock-operation.service';
import type { StockOperationType } from '../../stock-operation.model';

@Component({
  selector: 'app-stock-operation',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './stock-operation.html',
  styleUrl: './stock-operation.scss',
})
export class StockOperation {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);

  products: ProductResponse[] = [];

  selectedProductId: number | null = null;
  operationType: StockOperationType = 'SALE';
  quantity = 1;
  notes = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
      },
      error: () => {
        this.errorMessage = 'Unable to load products.';
      },
    });
  }

  get selectedProduct(): ProductResponse | undefined {
    return this.products.find(
      product => product.id === this.selectedProductId,
    );
  }

  submitOperation(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.selectedProductId === null) {
      this.errorMessage = 'Please select a product.';
      return;
    }

    if (!Number.isInteger(this.quantity) || this.quantity <= 0) {
      this.errorMessage = 'Quantity must be a positive whole number.';
      return;
    }

    this.isLoading = true;

    this.stockOperationService
      .createOperation(
        this.selectedProductId,
        this.operationType,
        this.quantity,
        this.notes.trim() || null,
      )
      .subscribe({
        next: operation => {
          this.successMessage =
            `Stock updated successfully. New stock: ${operation.newStock}.`;

          this.quantity = 1;
          this.notes = '';
          this.isLoading = false;

          this.loadProducts();
        },
        error: error => {
          this.errorMessage =
            error?.message || 'Unable to record stock operation.';

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
