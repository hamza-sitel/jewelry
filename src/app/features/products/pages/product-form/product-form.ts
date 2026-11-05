import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type {
  CreateProductRequest,
  ProductCategory,
  ProductTrackingMode,
  ProductType,
  UpdateProductRequest,
} from '../../product.model';
import { ProductService } from '../../product.service';
import { ProductCatalogService } from '../../product-catalog.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  productId: number | null = null;
  isEditMode = false;
  isLoading = true;
  isSaving = false;

  trackingMode: ProductTrackingMode = 'PIECE';
  name = '';
  categoryId = 1;
  typeId = 1;
  weight: number | null = null;
  quantity = 1;
  purchasePrice: number | null = null;
  salePrice: number | null = null;
  imageUrl = '';

  newCategoryName = '';
  newTypeName = '';
  categoryMessage = '';
  typeMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = Number.isSafeInteger(id) && id > 0;
    this.productId = this.isEditMode ? id : null;

    this.catalog
      .loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode && this.productId !== null) {
            this.loadProduct(this.productId);
            return;
          }

          this.categoryId = this.categories[0]?.id ?? 0;
          this.typeId = this.types[0]?.id ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load categories and product types.';
          this.isLoading = false;
        },
      });
  }

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get types(): ProductType[] {
    return this.catalog.getTypesForCategory(this.categoryId);
  }

  get selectedCategoryName(): string {
    return (
      this.categories.find(category => category.id === this.categoryId)?.name ??
      'selected category'
    );
  }

  get quantityHint(): string {
    if (this.isEditMode) {
      return 'Stock quantity is changed through stock operations, not product editing.';
    }

    return this.trackingMode === 'WEIGHTED'
      ? 'Enter the number of pieces. The recorded weight applies to each piece.'
      : 'Enter the number of pieces. No weight will be recorded for this product.';
  }

  private loadProduct(id: number): void {
    this.productService
      .getProductById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: product => {
          this.isLoading = false;

          if (!product) {
            this.errorMessage = 'Product not found.';
            return;
          }

          this.name = product.name;
          this.categoryId = product.categoryId;
          this.typeId = product.typeId;
          this.trackingMode = product.trackingMode;
          this.weight = product.weight;
          this.quantity = product.quantity;
          this.purchasePrice = product.purchasePrice;
          this.salePrice = product.salePrice;
          this.imageUrl = product.imageUrl ?? '';
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Unable to load this product.';
        },
      });
  }

  onCategoryChange(): void {
    this.typeMessage = '';
    this.typeId = this.types[0]?.id ?? 0;

    if (this.types.length === 0) {
      this.typeMessage = 'Add at least one type for this category before saving.';
    }
  }

  /** Switching to PIECE removes grams; switching to WEIGHTED requires per-piece grams. */
  onTrackingModeChange(): void {
    this.errorMessage = '';

    if (this.trackingMode === 'PIECE') {
      this.weight = null;
    }
  }

  addCategory(): void {
    this.categoryMessage = '';

    this.catalog
      .addCategory(this.newCategoryName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: category => {
          this.categoryId = category.id;
          this.typeId = 0;
          this.newCategoryName = '';
          this.categoryMessage = 'Category created. Now add at least one type.';
          this.typeMessage = 'A type is required before you can save a product.';
        },
        error: error => {
          this.categoryMessage = error?.message ?? 'Unable to create this category.';
        },
      });
  }

  addType(): void {
    this.typeMessage = '';

    if (this.categoryId <= 0) {
      this.typeMessage = 'Create or select a category first.';
      return;
    }

    this.catalog
      .addType(this.categoryId, this.newTypeName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: type => {
          this.typeId = type.id;
          this.newTypeName = '';
          this.typeMessage = `Type "${type.name}" added to ${this.selectedCategoryName}.`;
          this.categoryMessage = '';
        },
        error: error => {
          this.typeMessage = error?.message ?? 'Unable to add this type.';
        },
      });
  }

  onSubmit(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    this.errorMessage = '';
    const name = this.name.trim();

    if (!name) {
      this.errorMessage = 'Enter a product name.';
      return;
    }

    if (!this.categories.some(category => category.id === this.categoryId)) {
      this.errorMessage = 'Select a valid product category.';
      return;
    }

    if (!this.types.some(type => type.id === this.typeId)) {
      this.errorMessage = 'Select a valid type for the selected category.';
      return;
    }

    if (this.trackingMode !== 'PIECE' && this.trackingMode !== 'WEIGHTED') {
      this.errorMessage = 'Select a valid tracking mode.';
      return;
    }

    if (!this.isEditMode && (!Number.isSafeInteger(this.quantity) || this.quantity < 1)) {
      this.errorMessage = 'Quantity must be a positive whole number for either tracking mode.';
      return;
    }

    if (this.trackingMode === 'PIECE' && this.weight !== null) {
      this.errorMessage = 'Piece-based products cannot have a recorded weight.';
      return;
    }

    if (
      this.trackingMode === 'WEIGHTED' &&
      (this.weight === null || !Number.isFinite(this.weight) || this.weight <= 0)
    ) {
      this.errorMessage = 'Enter the exact weight per piece, greater than zero.';
      return;
    }

    if (
      this.purchasePrice === null ||
      this.salePrice === null ||
      !Number.isFinite(this.purchasePrice) ||
      !Number.isFinite(this.salePrice) ||
      this.purchasePrice < 0 ||
      this.salePrice < 0
    ) {
      this.errorMessage = 'Enter valid purchase and sale prices.';
      return;
    }

    const details: UpdateProductRequest = {
      name,
      categoryId: this.categoryId,
      typeId: this.typeId,
      weight: this.trackingMode === 'PIECE' ? null : this.weight,
      purchasePrice: this.purchasePrice,
      salePrice: this.salePrice,
      imageUrl: this.imageUrl.trim() || null,
    };

    this.isSaving = true;

    const saveOperation =
      this.isEditMode && this.productId !== null
        ? this.productService.updateProduct(this.productId, details)
        : this.productService.createProduct({
            ...details,
            trackingMode: this.trackingMode,
            quantity: this.quantity,
          } satisfies CreateProductRequest);

    saveOperation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: product => {
        this.isSaving = false;

        if (!product) {
          this.errorMessage = 'The product could not be found.';
          return;
        }

        void this.router.navigate(['/products']);
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = error?.message ?? 'Unable to save the product. Please try again.';
      },
    });
  }
}
