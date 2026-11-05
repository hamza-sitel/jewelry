import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DEFAULT_PAGE_SIZE, Pagination } from '../../../../shared/components/pagination/pagination';
import { StockOperationService } from '../../services/stock-operation.service';
import type { StockOperation, StockOperationType } from '../../stock-operation.model';

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
  operations: StockOperation[] = [];
  selectedFilter: StockOperationType | 'ALL' = 'ALL';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadOperations();
  }

  get filteredOperations(): StockOperation[] {
    if (this.selectedFilter === 'ALL') {
      return this.operations;
    }

    return this.operations.filter(operation => operation.type === this.selectedFilter);
  }

  get paginatedOperations(): StockOperation[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOperations.slice(startIndex, startIndex + this.pageSize);
  }

  onFilterChange(): void {
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

  getQuantityChange(operation: StockOperation): string {
    const isPositive = operation.type === 'PURCHASE' || operation.type === 'MANUAL_ADD';
    return `${isPositive ? '+' : '-'}${operation.quantity}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
