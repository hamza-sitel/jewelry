
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

@Component({
  selector: 'app-barcode-scan',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './barcode-scan.html',
  styleUrl: './barcode-scan.scss',
})
export class BarcodeScan implements AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('barcodeInput')
  private barcodeInput!: ElementRef<HTMLInputElement>;

  barcodeValue = '';
  lastScannedBarcode = '';
  scannedProduct: ProductResponse | null = null;

  isSearching = false;
  errorMessage = '';

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

  clearResult(): void {
    this.scannedProduct = null;
    this.lastScannedBarcode = '';
    this.errorMessage = '';
    this.barcodeValue = '';
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

  private focusBarcodeInput(): void {
    this.barcodeInput?.nativeElement.focus();
  }
}
