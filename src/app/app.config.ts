
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { PRODUCT_DATA_SOURCE } from './features/products/product-data-source';
import { MockProductDataSource } from './features/products/mock-product-data-source';

import { STOCK_OPERATION_DATA_SOURCE } from './features/inventory/stock-operation-data-source';
import { MockStockOperationDataSource } from './features/inventory/mock-stock-operation-data-source';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    {
      provide: PRODUCT_DATA_SOURCE,
      useClass: MockProductDataSource,
    },
    {
      provide: STOCK_OPERATION_DATA_SOURCE,
      useClass: MockStockOperationDataSource,
    },
  ],
};
