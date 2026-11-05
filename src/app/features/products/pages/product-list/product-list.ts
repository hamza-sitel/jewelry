import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type {
  ProductCategory,
  ProductResponse,
  ProductTrackingMode,
  ProductType,
} from '../../product.model';
import { ProductService } from '../../product.service';
import { ProductCatalogService } from '../../product-catalog.service';
import { ProductTrackingModeLabelPipe } from '../../../../shared/pipes/product-tracking-mode.pipe';
import { DEFAULT_PAGE_SIZE, Pagination } from '../../../../shared/components/pagination/pagination';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type StatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink, ProductTrackingModeLabelPipe, Pagination],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly destroyRef = inject(DestroyRef);

  products: ProductResponse[] = [];
  readonly pageSize = DEFAULT_PAGE_SIZE;
  currentPage = 1;
  searchTerm = '';
  selectedCategoryId: number | 'ALL' = 'ALL';
  selectedTypeId: number | 'ALL' = 'ALL';
  selectedTrackingMode: ProductTrackingMode | 'ALL' = 'ALL';
  selectedStockFilter: StockFilter = 'ALL';
  selectedStatus: StatusFilter = 'ALL';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get availableTypes(): ProductType[] {
    return this.selectedCategoryId === 'ALL'
      ? this.catalog.getTypes()
      : this.catalog.getTypesForCategory(this.selectedCategoryId);
  }

  get filteredProducts(): ProductResponse[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();

    return this.products.filter(product => {
      const matchesSearch =
        !term ||
        [
          product.name,
          product.barcode,
          product.categoryName,
          product.typeName,
          product.trackingMode,
        ].some(value => value.toLocaleLowerCase().includes(term));

      const matchesCategory =
        this.selectedCategoryId === 'ALL' ||
        product.categoryId === this.selectedCategoryId;
      const matchesType =
        this.selectedTypeId === 'ALL' || product.typeId === this.selectedTypeId;
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

      const matchesStatus =
        this.selectedStatus === 'ALL' || product.status === this.selectedStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesTracking &&
        matchesStock &&
        matchesStatus
      );
    });
  }

  get paginatedProducts(): ProductResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
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
          this.currentPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load products. Please try again.';
          this.isLoading = false;
        },
      });
  }

  onCategoryFilterChange(): void {
    this.selectedTypeId = 'ALL';
    this.currentPage = 1;
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = 'ALL';
    this.selectedTypeId = 'ALL';
    this.selectedTrackingMode = 'ALL';
    this.selectedStockFilter = 'ALL';
    this.selectedStatus = 'ALL';
    this.currentPage = 1;
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
