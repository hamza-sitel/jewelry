
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import type { ProductResponse } from '../../product.model';
import { ProductService } from '../../product.service';

import { StockOperationService } from '../../../inventory/services/stock-operation.service';
import type { StockOperationType } from '../../../inventory/stock-operation.model';

@Component({
  selector: 'app-barcode-scan',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './barcode-scan.html',
  styleUrl: './barcode-scan.scss',
})
export class BarcodeScan implements AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('barcodeInput')
  private barcodeInput!: ElementRef<HTMLInputElement>;

  barcodeValue = '';
  lastScannedBarcode = '';
  scannedProduct: ProductResponse | null = null;

  isSearching = false;
  isSaving = false;

  errorMessage = '';
  operationErrorMessage = '';
  operationSuccessMessage = '';

  operationType: StockOperationType = 'SALE';
  operationQuantity = 1;
  operationNotes = '';

  ngAfterViewInit(): void {
    this.focusBarcodeInput();
  }

  searchBarcode(): void {
    const barcode = this.barcodeValue.trim().toUpperCase();

    if (!barcode || this.isSearching) {
      return;
    }

    this.lastScannedBarcode = barcode;
    this.scannedProduct = null;
    this.errorMessage = '';
    this.clearOperationMessages();
    this.isSearching = true;

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.scannedProduct =
            products.find(
              product => product.barcode.toUpperCase() === barcode,
            ) ?? null;

          if (!this.scannedProduct) {
            this.errorMessage = `No product found for barcode "${barcode}".`;
          }

          this.isSearching = false;
          this.barcodeValue = '';
          this.focusBarcodeInput();
        },
        error: () => {
          this.errorMessage =
            'Unable to search products. Please try again.';

          this.isSearching = false;
          this.focusBarcodeInput();
        },
      });
  }

  submitStockOperation(): void {
    this.clearOperationMessages();

    if (!this.scannedProduct) {
      this.operationErrorMessage = 'Please scan a product first.';
      return;
    }

    if (
      !Number.isInteger(this.operationQuantity) ||
      this.operationQuantity <= 0
    ) {
      this.operationErrorMessage =
        'Quantity must be a positive whole number.';
      return;
    }

    this.isSaving = true;

    const productId = this.scannedProduct.id;

    this.stockOperationService
      .createOperation(
        productId,
        this.operationType,
        this.operationQuantity,
        this.operationNotes.trim() || null,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: operation => {
          if (this.scannedProduct?.id === productId) {
            this.scannedProduct = {
              ...this.scannedProduct,
              quantity: operation.newStock,
            };
          }

          this.operationSuccessMessage =
            `Operation saved successfully. New stock: ${operation.newStock} piece(s).`;

          this.operationQuantity = 1;
          this.operationNotes = '';
          this.isSaving = false;
        },
        error: error => {
          this.operationErrorMessage =
            error?.message || 'Unable to save stock operation.';

          this.isSaving = false;
        },
      });
  }

  clearResult(): void {
    this.scannedProduct = null;
    this.lastScannedBarcode = '';
    this.errorMessage = '';
    this.barcodeValue = '';

    this.operationType = 'SALE';
    this.operationQuantity = 1;
    this.operationNotes = '';

    this.clearOperationMessages();
    this.focusBarcodeInput();
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

  private clearOperationMessages(): void {
    this.operationErrorMessage = '';
    this.operationSuccessMessage = '';
  }

  private focusBarcodeInput(): void {
    this.barcodeInput?.nativeElement.focus();
  }
}
