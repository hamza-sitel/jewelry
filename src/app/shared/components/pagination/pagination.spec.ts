import { Pagination } from './pagination';

describe('Pagination', () => {
  it('shows twenty records on the first page when page size is twenty', () => {
    const pagination = new Pagination();
    pagination.totalItems = 45;
    pagination.pageSize = 20;
    pagination.currentPage = 1;

    expect(pagination.firstItem).toBe(1);
    expect(pagination.lastItem).toBe(20);
    expect(pagination.totalPages).toBe(3);
  });

  it('calculates the final page range correctly', () => {
    const pagination = new Pagination();
    pagination.totalItems = 45;
    pagination.pageSize = 20;
    pagination.currentPage = 3;

    expect(pagination.firstItem).toBe(41);
    expect(pagination.lastItem).toBe(45);
  });

  it('keeps page controls compact for long lists', () => {
    const pagination = new Pagination();
    pagination.totalItems = 400;
    pagination.pageSize = 20;
    pagination.currentPage = 10;

    expect(pagination.visiblePages).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('emits a requested valid page', () => {
    const pagination = new Pagination();
    pagination.totalItems = 45;
    pagination.pageSize = 20;
    let emittedPage = 0;
    pagination.pageChange.subscribe(page => {
      emittedPage = page;
    });

    pagination.goToPage(2);

    expect(emittedPage).toBe(2);
  });
});
