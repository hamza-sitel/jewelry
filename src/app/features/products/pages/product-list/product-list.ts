
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type {
  ProductCategory,
  ProductResponse,
  ProductTrackingMode,
  ProductType,
} from '../../product.model';

import { ProductService } from '../../product.service';
import { ProductCatalogService } from '../../product-catalog.service';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];

  searchTerm = '';
  selectedCategoryId: number | 'ALL' = 'ALL';
  selectedTypeId: number | 'ALL' = 'ALL';
  selectedTrackingMode: ProductTrackingMode | 'ALL' = 'ALL';
  selectedStockFilter: StockFilter = 'ALL';

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get availableTypes(): ProductType[] {
    if (this.selectedCategoryId === 'ALL') {
      return this.catalog.getTypes();
    }

    return this.catalog.getTypesForCategory(this.selectedCategoryId);
  }

  get filteredProducts(): ProductResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.products.filter(product => {
      const matchesSearch =
        !term ||
        [
          product.name,
          product.barcode,
          product.categoryName,
          product.typeName,
          product.trackingMode,
        ].some(value => value.toLowerCase().includes(term));

      const matchesCategory =
        this.selectedCategoryId === 'ALL' ||
        product.categoryId === this.selectedCategoryId;

      const matchesType =
        this.selectedTypeId === 'ALL' ||
        product.typeId === this.selectedTypeId;

      const matchesTracking =
        this.selectedTrackingMode === 'ALL' ||
        product.trackingMode === this.selectedTrackingMode;

      let matchesStock = true;

      if (this.selectedStockFilter === 'IN_STOCK') {
        matchesStock = product.quantity > 0;
      } else if (this.selectedStockFilter === 'LOW_STOCK') {
        matchesStock = product.quantity > 0 && product.quantity <= 3;
      } else if (this.selectedStockFilter === 'OUT_OF_STOCK') {
        matchesStock = product.quantity === 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesTracking &&
        matchesStock
      );
    });
  }

  loadProducts(): void {
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
          this.errorMessage =
            'Unable to load products. Please try again.';
          this.isLoading = false;
        },
      });
  }

  onCategoryFilterChange(): void {
    this.selectedTypeId = 'ALL';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = 'ALL';
    this.selectedTypeId = 'ALL';
    this.selectedTrackingMode = 'ALL';
    this.selectedStockFilter = 'ALL';
  }

  formatPrice(price: number): string {
    return `${price.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DH`;
  }

  formatWeight(weight: number | null): string {
    if (weight === null) {
      return '—';
    }

    return `${weight.toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })} g`;
  }
}
