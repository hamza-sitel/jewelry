import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { ProductCategory, ProductType } from '../../../products/product.model';
import { ProductCatalogService } from '../../../products/product-catalog.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss',
})
export class CategoryManagement {
  private readonly catalog = inject(ProductCatalogService);

  selectedCategoryId = 1;

  newCategoryName = '';
  editingCategoryName = '';

  newTypeName = '';
  editingTypeId: number | null = null;
  editingTypeName = '';

  message = '';
  errorMessage = '';

  get categories(): ProductCategory[] {
    return this.catalog.getCategories();
  }

  get types(): ProductType[] {
    return this.catalog.getTypesForCategory(this.selectedCategoryId);
  }

  get selectedCategoryName(): string {
    return (
      this.categories.find(
        category => category.id === this.selectedCategoryId,
      )?.name ?? ''
    );
  }

  addCategory(): void {
    this.message = '';
    this.errorMessage = '';

    const category = this.catalog.addCategory(this.newCategoryName);

    if (!category) {
      this.errorMessage =
        'Enter a unique category name. Empty or duplicate names are not allowed.';
      return;
    }

    this.selectedCategoryId = category.id;
    this.editingCategoryName = category.name;
    this.newCategoryName = '';
    this.message = 'Category added. Add at least one type before using it.';
  }

  startCategoryEdit(): void {
    this.editingCategoryName = this.selectedCategoryName;
    this.message = '';
    this.errorMessage = '';
  }

  saveCategoryEdit(): void {
    this.message = '';
    this.errorMessage = '';

    const updated = this.catalog.updateCategory(
      this.selectedCategoryId,
      this.editingCategoryName,
    );

    if (!updated) {
      this.errorMessage =
        'Enter a unique category name. Empty or duplicate names are not allowed.';
      return;
    }

    this.message = 'Category name updated.';
  }

  addType(): void {
    this.message = '';
    this.errorMessage = '';

    const type = this.catalog.addType(
      this.selectedCategoryId,
      this.newTypeName,
    );

    if (!type) {
      this.errorMessage =
        'Enter a unique type name for the selected category.';
      return;
    }

    this.newTypeName = '';
    this.message = `Type "${type.name}" added.`;
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

    const updated = this.catalog.updateType(
      this.editingTypeId,
      this.editingTypeName,
    );

    if (!updated) {
      this.errorMessage =
        'Enter a unique type name for this category.';
      return;
    }

    this.editingTypeId = null;
    this.editingTypeName = '';
    this.message = 'Type name updated.';
  }

  cancelTypeEdit(): void {
    this.editingTypeId = null;
    this.editingTypeName = '';
    this.errorMessage = '';
  }
}