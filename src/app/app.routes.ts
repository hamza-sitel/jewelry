
import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { ProductForm } from './features/products/pages/product-form/product-form';
import { CategoryManagement } from './features/categories/pages/category-management/category-management';
export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/product-list/product-list')
          .then((m) => m.ProductList),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import("./features/dashboard/dashboard/dashboard")
            .then(m => m.Dashboard)
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/pages/product-form/product-form')
            .then((m) => m.ProductForm),
      },
    ]
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
    path: '**',
    redirectTo: 'dashboard'
  },

]; 
