
import { Routes } from '@angular/router';

import { AppLayout } from './core/layout/app-layout/app-layout';
import { ProductForm } from './features/products/pages/product-form/product-form';
import { CategoryManagement } from './features/categories/pages/category-management/category-management';
import { StockOperation } from './features/inventory/pages/stock-operation/stock-operation';
import { StockHistory } from './features/inventory/pages/stock-history/stock-history';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard')
            .then(m => m.Dashboard),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/product-list/product-list')
            .then(m => m.ProductList),
      },
      {
        path: 'products/new',
        component: ProductForm,
      },
      {
        path: 'products/:id/edit',
        component: ProductForm,
      },
      {
        path: 'categories',
        component: CategoryManagement,
      },
      {
        path: 'barcode',
        loadComponent: () =>
          import('./features/products/pages/barcode-scan/barcode-scan')
            .then(m => m.BarcodeScan),
      },
      {
        path: 'stock-operation',
        component: StockOperation,
      },
      {
        path: 'stock-history',
        component: StockHistory,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
