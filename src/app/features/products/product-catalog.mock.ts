import type { ProductCatalogSnapshot } from './product.model';

/** Initial catalog used by the local mock data source. */
export const MOCK_PRODUCT_CATALOG: ProductCatalogSnapshot = {
  categories: [
    { id: 1, name: '18K Gold' },
    { id: 2, name: '925 Silver' },
    { id: 3, name: 'Steel' },
    { id: 4, name: '800 Silver' },
    { id: 5, name: 'Jewelry & Stones' },
  ],
  types: [
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
  ],
};
