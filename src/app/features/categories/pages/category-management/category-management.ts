import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { ProductCategory, ProductType } from '../../../products/product.model';
import { ProductCatalogService } from '../../../products/product-catalog.service';
import { DEFAULT_PAGE_SIZE, Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [FormsModule, RouterLink, Pagination],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss',
})
export class CategoryManagement implements OnInit {
  private readonly catalog = inject(ProductCatalogService);
  private readonly destroyRef = inject(DestroyRef);

  selectedCategoryId = 1;
  readonly pageSize = DEFAULT_PAGE_SIZE;
  currentTypePage = 1;
  newCategoryName = '';
  editingCategoryName = '';
  newTypeName = '';
  editingTypeId: number | null = null;
  editingTypeName = '';
  message = '';
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    this.loadCatalog();
  }

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get types(): ProductType[] {
    return this.catalog.getTypesForCategory(this.selectedCategoryId);
  }

  get paginatedTypes(): ProductType[] {
    const startIndex = (this.currentTypePage - 1) * this.pageSize;
    return this.types.slice(startIndex, startIndex + this.pageSize);
  }

  get selectedCategoryName(): string {
    return this.categories.find(category => category.id === this.selectedCategoryId)?.name ?? '';
  }

  loadCatalog(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.catalog.loadCatalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (!this.categories.some(category => category.id === this.selectedCategoryId)) {
          this.selectedCategoryId = this.categories[0]?.id ?? 0;
        }
        this.editingCategoryName = this.selectedCategoryName;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load categories and types.';
        this.isLoading = false;
      },
    });
  }

  addCategory(): void {
    this.message = '';
    this.errorMessage = '';

    this.catalog.addCategory(this.newCategoryName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: category => {
          this.selectedCategoryId = category.id;
          this.editingCategoryName = category.name;
          this.newCategoryName = '';
          this.message = 'Category added. Add at least one type before creating products in it.';
        },
        error: error => {
          this.errorMessage = error?.message ?? 'Unable to add this category.';
        },
      });
  }

  startCategoryEdit(): void {
    this.currentTypePage = 1;
    this.editingCategoryName = this.selectedCategoryName;
    this.message = '';
    this.errorMessage = '';
  }

  saveCategoryEdit(): void {
    this.message = '';
    this.errorMessage = '';

    this.catalog.updateCategory(this.selectedCategoryId, this.editingCategoryName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          if (!updated) {
            this.errorMessage = 'Category not found.';
            return;
          }
          this.message = 'Category name updated.';
        },
        error: error => {
          this.errorMessage = error?.message ?? 'Unable to update this category.';
        },
      });
  }

  addType(): void {
    this.message = '';
    this.errorMessage = '';

    if (this.selectedCategoryId <= 0) {
      this.errorMessage = 'Create or select a category first.';
      return;
    }

    this.catalog.addType(this.selectedCategoryId, this.newTypeName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: type => {
          this.newTypeName = '';
          this.currentTypePage = Math.max(1, Math.ceil(this.types.length / this.pageSize));
          this.message = `Type "${type.name}" added.`;
        },
        error: error => {
          this.errorMessage = error?.message ?? 'Unable to add this type.';
        },
      });
  }

  startTypeEdit(type: ProductType): void {
    this.editingTypeId = type.id;
    this.editingTypeName = type.name;
    this.message = '';
    this.errorMessage = '';
  }

  saveTypeEdit(): void {
    if (this.editingTypeId === null) {
      return;
    }

    this.message = '';
    this.errorMessage = '';

    this.catalog.updateType(this.editingTypeId, this.editingTypeName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          if (!updated) {
            this.errorMessage = 'Type not found.';
            return;
          }
          this.editingTypeId = null;
          this.editingTypeName = '';
          this.message = 'Type name updated.';
        },
        error: error => {
          this.errorMessage = error?.message ?? 'Unable to update this type.';
        },
      });
  }

  cancelTypeEdit(): void {
    this.editingTypeId = null;
    this.editingTypeName = '';
    this.errorMessage = '';
  }
}
