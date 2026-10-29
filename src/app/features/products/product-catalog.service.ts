import { Injectable } from '@angular/core';

import type {
  ProductCategory,
  ProductType,
} from './product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private categories: ProductCategory[] = [
    { id: 1, name: '18K Gold' },
    { id: 2, name: '925 Silver' },
    { id: 3, name: 'Steel' },
    { id: 4, name: '800 Silver' },
    { id: 5, name: 'Jewelry & Stones' },
  ];

  private types: ProductType[] = [
    { id: 1, categoryId: 1, name: 'Ring' },
    { id: 2, categoryId: 1, name: 'Bracelet' },
    { id: 3, categoryId: 1, name: 'Chain' },
    { id: 4, categoryId: 1, name: 'Earrings' },
    { id: 5, categoryId: 1, name: 'Pendant' },
    { id: 6, categoryId: 2, name: 'Ring' },
    { id: 7, categoryId: 2, name: 'Bracelet' },
    { id: 8, categoryId: 2, name: 'Necklace' },
    { id: 9, categoryId: 2, name: 'Earrings' },
    { id: 10, categoryId: 2, name: 'Chain' },
    { id: 11, categoryId: 3, name: 'Bracelet' },
    { id: 12, categoryId: 3, name: 'Necklace' },
    { id: 13, categoryId: 3, name: 'Ring' },
    { id: 14, categoryId: 3, name: 'Earrings' },
    { id: 15, categoryId: 4, name: 'Ring' },
    { id: 16, categoryId: 4, name: 'Bracelet' },
    { id: 17, categoryId: 4, name: 'Earrings' },
    { id: 18, categoryId: 5, name: 'Emerald' },
    { id: 19, categoryId: 5, name: 'Ruby' },
    { id: 20, categoryId: 5, name: 'Sapphire' },
    { id: 21, categoryId: 5, name: 'Other Stone' },
  ];

  getCategories(): ProductCategory[] {
    return this.categories.map(category => ({ ...category }));
  }

  getTypes(): ProductType[] {
    return this.types.map(type => ({ ...type }));
  }

  getTypesForCategory(categoryId: number): ProductType[] {
    return this.types
      .filter(type => type.categoryId === categoryId)
      .map(type => ({ ...type }));
  }

  categoryHasTypes(categoryId: number): boolean {
    return this.types.some(type => type.categoryId === categoryId);
  }

  getCategoryName(categoryId: number): string {
    return (
      this.categories.find(category => category.id === categoryId)?.name ??
      'Unknown category'
    );
  }

  getTypeName(typeId: number): string {
    return this.types.find(type => type.id === typeId)?.name ?? 'Unknown type';
  }

  addCategory(name: string): ProductCategory | null {
    const normalizedName = name.trim();

    if (
      !normalizedName ||
      this.categories.some(
        category =>
          category.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return null;
    }

    const category: ProductCategory = {
      id: this.nextId(this.categories),
      name: normalizedName,
    };

    this.categories.push(category);

    return { ...category };
  }

  updateCategory(id: number, name: string): boolean {
    const normalizedName = name.trim();
    const category = this.categories.find(item => item.id === id);

    if (
      !category ||
      !normalizedName ||
      this.categories.some(
        item =>
          item.id !== id &&
          item.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return false;
    }

    category.name = normalizedName;
    return true;
  }

  addType(categoryId: number, name: string): ProductType | null {
    const normalizedName = name.trim();

    if (
      !this.categories.some(category => category.id === categoryId) ||
      !normalizedName ||
      this.types.some(
        type =>
          type.categoryId === categoryId &&
          type.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return null;
    }

    const type: ProductType = {
      id: this.nextId(this.types),
      categoryId,
      name: normalizedName,
    };

    this.types.push(type);

    return { ...type };
  }

  updateType(id: number, name: string): boolean {
    const normalizedName = name.trim();
    const type = this.types.find(item => item.id === id);

    if (
      !type ||
      !normalizedName ||
      this.types.some(
        item =>
          item.id !== id &&
          item.categoryId === type.categoryId &&
          item.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return false;
    }

    type.name = normalizedName;
    return true;
  }

  private nextId(items: { id: number }[]): number {
    return Math.max(0, ...items.map(item => item.id)) + 1;
  }
}