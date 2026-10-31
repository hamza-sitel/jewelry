
import { Component, inject } from '@angular/core';
import { StockOperationService } from '../../services/stock-operation.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  StockOperation,
  StockOperationType,
} from '../../stock-operation.model';

@Component({
  selector: 'app-stock-history',
  standalone: true,
  imports:[FormsModule,RouterLink],
  templateUrl: './stock-history.html',
  styleUrl: './stock-history.scss',
})
export class StockHistory {
  private readonly stockOperationService = inject(StockOperationService);

  operations: StockOperation[] = [];
  selectedFilter: StockOperationType | 'ALL' = 'ALL';

  isLoading = true;
  errorMessage = '';

  constructor() {
    this.loadOperations();
  }

  get filteredOperations(): StockOperation[] {
    if (this.selectedFilter === 'ALL') {
      return this.operations;
    }

    return this.operations.filter(
      operation => operation.type === this.selectedFilter,
    );
  }

  loadOperations(): void {
    this.isLoading = true;

    this.stockOperationService.getOperations().subscribe({
      next: operations => {
        this.operations = operations;
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
    const isPositive =
      operation.type === 'PURCHASE' ||
      operation.type === 'MANUAL_ADD';

    return `${isPositive ? '+' : '-'}${operation.quantity}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
