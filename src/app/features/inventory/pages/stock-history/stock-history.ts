import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  DEFAULT_PAGE_SIZE,
  Pagination,
} from '../../../../shared/components/pagination/pagination';
import { StockOperationService } from '../../services/stock-operation.service';
import type {
  StockOperationResponse,
  StockOperationType,
} from '../../stock-operation.model';

type HistorySortOrder = 'NEWEST' | 'OLDEST';

@Component({
  selector: 'app-stock-history',
  standalone: true,
  imports: [FormsModule, RouterLink, Pagination],
  templateUrl: './stock-history.html',
  styleUrl: './stock-history.scss',
})
export class StockHistory implements OnInit {
  private readonly stockOperationService = inject(StockOperationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  currentPage = 1;
  operations: StockOperationResponse[] = [];

  searchTerm = '';
  selectedFilter: StockOperationType | 'ALL' = 'ALL';
  dateFrom = '';
  dateTo = '';
  sortOrder: HistorySortOrder = 'NEWEST';

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadOperations();
  }

  get dateRangeErrorMessage(): string {
    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      return 'The start date must be earlier than or equal to the end date.';
    }

    return '';
  }

  get filteredOperations(): StockOperationResponse[] {
    if (this.dateRangeErrorMessage) {
      return [];
    }

    const search = this.searchTerm.trim().toLocaleLowerCase();

    return this.operations
      .filter(operation => {
        const matchesType =
          this.selectedFilter === 'ALL' || operation.type === this.selectedFilter;

        const searchableText = [
          operation.productName,
          operation.barcode,
          operation.notes ?? '',
          String(operation.productId),
        ]
          .join(' ')
          .toLocaleLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        const operationDate = this.toLocalDateInputValue(operation.createdAt);
        const matchesFrom = !this.dateFrom || operationDate >= this.dateFrom;
        const matchesTo = !this.dateTo || operationDate <= this.dateTo;

        return matchesType && matchesSearch && matchesFrom && matchesTo;
      })
      .sort((first, second) => {
        const difference =
          new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();

        return this.sortOrder === 'NEWEST' ? -difference : difference;
      });
  }

  get paginatedOperations(): StockOperationResponse[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOperations.slice(startIndex, startIndex + this.pageSize);
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedFilter = 'ALL';
    this.dateFrom = '';
    this.dateTo = '';
    this.sortOrder = 'NEWEST';
    this.currentPage = 1;
  }

  loadOperations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.stockOperationService
      .getOperations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: operations => {
          this.operations = operations;
          this.currentPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load stock history.';
          this.isLoading = false;
        },
      });
  }

  getOperationLabel(type: StockOperationType): string {
    const labels: Record<StockOperationType, string> = {
      PURCHASE: 'Purchase',
      SALE: 'Sale',
      MANUAL_ADD: 'Manual addition',
      MANUAL_REMOVE: 'Manual removal',
    };

    return labels[type];
  }

  getOperationClass(type: StockOperationType): string {
    switch (type) {
      case 'PURCHASE':
      case 'MANUAL_ADD':
        return 'positive';
      case 'SALE':
      case 'MANUAL_REMOVE':
        return 'negative';
    }
  }

  getQuantityChange(operation: StockOperationResponse): string {
    const isPositive =
      operation.type === 'PURCHASE' || operation.type === 'MANUAL_ADD';

    return `${isPositive ? '+' : '-'}${operation.quantity}`;
  }

  formatDate(date: string): string {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return 'Invalid date';
    }

    return value.toLocaleString('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private toLocalDateInputValue(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
