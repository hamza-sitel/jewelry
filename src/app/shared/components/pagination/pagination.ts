import { Component, EventEmitter, Input, Output } from '@angular/core';

export const DEFAULT_PAGE_SIZE = 20;

/** Reusable client-side pagination controls for data tables and long lists. */
@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  @Input() totalItems = 0;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.pageSize)));
  }

  get firstItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  /** Keep the page-number control compact when a list has many pages. */
  get visiblePages(): Array<number | null> {
    const total = this.totalPages;

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (this.currentPage <= 4) {
      return [1, 2, 3, 4, 5, null, total];
    }

    if (this.currentPage >= total - 3) {
      return [1, null, total - 4, total - 3, total - 2, total - 1, total];
    }

    return [
      1,
      null,
      this.currentPage - 1,
      this.currentPage,
      this.currentPage + 1,
      null,
      total,
    ];
  }

  goToPage(page: number): void {
    if (!Number.isInteger(page) || page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.pageChange.emit(page);
  }
}
