import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type {
  CreateProductRequest,
  ProductCategory,
  ProductTrackingMode,
  ProductType,
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

  productId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  trackingMode: ProductTrackingMode = 'INDIVIDUAL';

  name = '';
  categoryId = 1;
  typeId = 1;

  weight: number | null = null;
  quantity = 1;

  purchasePrice: number | null = null;
  salePrice: number | null = null;

  newCategoryName = '';
  newTypeName = '';

  categoryMessage = '';
  typeMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isInteger(id) && id > 0) {
      this.productId = id;
      this.isEditMode = true;
      this.loadProduct(id);
    } else {
      this.typeId = this.types[0]?.id ?? 0;
    }
  }

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get selectedCategoryName(): string {
    return (
      this.categories.find(category => category.id === this.categoryId)?.name ??
      'selected category'
    );
  }

  get types(): ProductType[] {
    return this.catalog.getTypesForCategory(this.categoryId);
  }

  get selectedCategoryHasTypes(): boolean {
    return this.catalog.categoryHasTypes(this.categoryId);
  }

  private loadProduct(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProductById(id).subscribe({
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

    if (!this.selectedCategoryHasTypes) {
      this.typeMessage =
        'Add at least one type for this category before saving.';
    }
  }

  addCategory(): void {
    this.categoryMessage = '';

    const category = this.catalog.addCategory(this.newCategoryName);

    if (!category) {
      this.categoryMessage =
        'Enter a name that is not empty or already used.';
      return;
    }

    this.categoryId = category.id;
    this.typeId = 0;
    this.newCategoryName = '';

    this.categoryMessage =
      'Category created. Now add at least one type for this category.';
    this.typeMessage =
      'A type is required before you can save a product.';
  }

  addType(): void {
    this.typeMessage = '';

    const type = this.catalog.addType(this.categoryId, this.newTypeName);

    if (!type) {
      this.typeMessage =
        'Enter a type name that is not empty or already used in this category.';
      return;
    }

    this.typeId = type.id;
    this.newTypeName = '';
    this.typeMessage = `Type "${type.name}" added to ${this.selectedCategoryName}.`;
    this.categoryMessage = '';
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

    if (
      !this.selectedCategoryHasTypes ||
      !this.types.some(type => type.id === this.typeId)
    ) {
      this.errorMessage =
        'Add or select a valid type for the selected category.';
      return;
    }

    if (!Number.isInteger(this.quantity) || this.quantity < 1) {
      this.errorMessage = 'Quantity must be a whole number of at least 1.';
      return;
    }

    if (
      this.weight !== null &&
      (!Number.isFinite(this.weight) || this.weight <= 0)
    ) {
      this.errorMessage = 'Weight must be greater than zero or left empty.';
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

    const request: CreateProductRequest = {
      name,
      categoryId: this.categoryId,
      typeId: this.typeId,
      trackingMode: this.trackingMode,
      weight: this.weight,
      quantity: this.quantity,
      purchasePrice: this.purchasePrice,
      salePrice: this.salePrice,
      imageUrl: null,
    };

    this.isSaving = true;

    const operation = this.isEditMode && this.productId !== null
      ? this.productService.updateProduct(this.productId, request)
      : this.productService.createProduct(request);

    operation.subscribe({
      next: product => {
        this.isSaving = false;

        if (!product) {
          this.errorMessage = 'The product could not be found.';
          return;
        }

        void this.router.navigate(['/products']);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = this.isEditMode
          ? 'Unable to update the product. Please try again.'
          : 'Unable to create the product. Please try again.';
      },
    });
  }
}