import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { Provider } from '@angular/core';

import { AUTH_DATA_SOURCE } from './core/auth/auth-data-source';
import { MockAuthDataSource } from './core/auth/mock-auth-data-source';
import { ApiAuthDataSource } from './core/auth/api-auth-data-source';
import { API_BASE_URL } from './core/api/api.config';
import { apiAuthInterceptor } from './core/api/api-auth.interceptor';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { APP_DATA_MODE } from './core/config/app-mode';
import { PRODUCT_DATA_SOURCE } from './features/products/product-data-source';
import { MockProductDataSource } from './features/products/mock-product-data-source';
import { ApiProductDataSource } from './features/products/api/api-product-data-source';
import { PRODUCT_CATALOG_DATA_SOURCE } from './features/products/product-catalog-data-source';
import { MockProductCatalogDataSource } from './features/products/mock-product-catalog-data-source';
import { ApiProductCatalogDataSource } from './features/products/api/api-product-catalog-data-source';
import { STOCK_OPERATION_DATA_SOURCE } from './features/inventory/stock-operation-data-source';
import { MockStockOperationDataSource } from './features/inventory/mock-stock-operation-data-source';
import { ApiStockOperationDataSource } from './features/inventory/api/api-stock-operation-data-source';
import { routes } from './app.routes';

const mockDataSourceProviders: Provider[] = [
  { provide: AUTH_DATA_SOURCE, useClass: MockAuthDataSource },
  { provide: PRODUCT_DATA_SOURCE, useClass: MockProductDataSource },
  { provide: PRODUCT_CATALOG_DATA_SOURCE, useClass: MockProductCatalogDataSource },
  { provide: STOCK_OPERATION_DATA_SOURCE, useClass: MockStockOperationDataSource },
];

const apiDataSourceProviders: Provider[] = [
  { provide: AUTH_DATA_SOURCE, useClass: ApiAuthDataSource },
  { provide: PRODUCT_DATA_SOURCE, useClass: ApiProductDataSource },
  { provide: PRODUCT_CATALOG_DATA_SOURCE, useClass: ApiProductCatalogDataSource },
  { provide: STOCK_OPERATION_DATA_SOURCE, useClass: ApiStockOperationDataSource },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiAuthInterceptor, apiErrorInterceptor])),
    { provide: API_BASE_URL, useValue: 'http://localhost:8080/api' },
    ...(APP_DATA_MODE === 'mock' ? mockDataSourceProviders : apiDataSourceProviders),
  ],
};
