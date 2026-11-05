import { Routes } from '@angular/router';

import { AppLayout } from './core/layout/app-layout/app-layout';
import { ProductForm } from './features/products/pages/product-form/product-form';
import { CategoryManagement } from './features/categories/pages/category-management/category-management';
import { StockOperation } from './features/inventory/pages/stock-operation/stock-operation';
import { StockHistory } from './features/inventory/pages/stock-history/stock-history';
import { authGuard, adminGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(module => module.Login),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales-workspace').then(module => module.SalesWorkspace),
      },
      {
        path: '',
        canActivate: [adminGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(module => module.Dashboard),
          },
          {
            path: 'products',
            loadComponent: () => import('./features/products/pages/product-list/product-list').then(module => module.ProductList),
          },
          { path: 'products/new', component: ProductForm },
          { path: 'products/:id/edit', component: ProductForm },
          {
            path: 'products/:id',
            loadComponent: () => import('./features/products/pages/product-details/product-details').then(module => module.ProductDetails),
          },
          { path: 'categories', component: CategoryManagement },
          {
            path: 'barcode',
            loadComponent: () => import('./features/products/pages/barcode-scan/barcode-scan').then(module => module.BarcodeScan),
          },
          { path: 'stock-operation', component: StockOperation },
          { path: 'stock-history', component: StockHistory },
          {
            path: 'reports',
            loadComponent: () => import('./features/reports/reports').then(module => module.Reports),
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/settings/settings').then(module => module.Settings),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
