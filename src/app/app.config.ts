import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PRODUCT_DATA_SOURCE } from './features/products/product-data-source';
import { MockProductDataSource } from './features/products/mock-product-data-source';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: PRODUCT_DATA_SOURCE, useClass: MockProductDataSource }
  ]
}; 
