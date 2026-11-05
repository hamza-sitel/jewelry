# Phase 5 — Admin, Employees and Sales

## Scope
This phase adds a frontend prototype with two roles:

- **ADMIN:** access to all existing inventory pages, dashboard, reports, settings and sales workspace.
- **EMPLOYEE:** access only to the Sales workspace. Employees can search active products, see stock on hand and record a sale. They cannot create/edit/archive products, manage categories, create purchases/manual stock changes, view reports, or manage accounts.

The employee sale submits the existing `CreateStockOperationRequest` contract with `type: 'SALE'`. `StockOperationService` and the existing mock data source calculate and persist the new stock quantity and history record. This phase does not implement customer records, payment processing, receipts/invoices, discounts or accounting.

## Prototype administrator login
- Username: `admin`
- Initial password: `Admin@123`
- Change this password from Settings after the first sign-in.

Employee accounts are created by an administrator at **Settings & team**. There is no configured employee-count limit. Usernames must be 3–30 characters using letters, digits, dot, dash or underscore. Passwords must be 8–128 characters.

## How authentication works
`AuthService` depends on the `AUTH_DATA_SOURCE` abstraction. `MockAuthDataSource` provides browser-local prototype behavior using the existing `BrowserStorageService`. Passwords are stored as salted PBKDF2 hashes, not readable text. A current session stores the user ID. Disabled employees cannot sign in. The UI receives `UserResponse`, which never includes password salt or hash.

This is **not production authentication**. Browser localStorage and client-side role checks can be changed by the browser user. A real Spring Boot backend must authenticate users, issue/validate a secure session or JWT, and enforce ADMIN/EMPLOYEE permissions on every protected API. Never trust Angular guards as the security boundary.

## Route access
| Route | Admin | Employee |
|---|---:|---:|
| `/login` | Sign-in page when logged out | Sign-in page when logged out |
| `/dashboard` | Yes | No |
| `/products`, product details/forms | Yes | No |
| `/categories` | Yes | No |
| `/barcode` | Yes | No |
| `/stock-operation` | Yes | No |
| `/stock-history` | Yes | No |
| `/reports` | Yes | No |
| `/settings` | Yes | No |
| `/sales` | Yes | Yes |

The empty path and unknown routes redirect to `/dashboard`; an employee is redirected to `/sales` by the Admin-only route guard.

## Data flow
1. Login page calls `AuthService.login()`.
2. `AuthService` delegates to `AUTH_DATA_SOURCE`; `MockAuthDataSource` validates credentials and saves a local session.
3. `authGuard` requires a signed-in user. `adminGuard` protects all existing management routes.
4. `AppLayout` displays navigation based on the current role.
5. `SalesWorkspace` loads products through `ProductService` and shows active products and current quantities.
6. A sale submits `{ productId, type: 'SALE', quantity, notes }` to `StockOperationService.createOperation()`.
7. The existing mock stock-operation data source updates the product quantity and records the operation. The workspace updates the visible stock using the returned `newStock` value.

## New files
- `src/app/core/auth/auth.model.ts`
- `src/app/core/auth/auth-data-source.ts`
- `src/app/core/auth/mock-auth-data-source.ts`
- `src/app/core/auth/auth.service.ts`
- `src/app/core/auth/auth.guards.ts`
- `src/app/features/auth/login/login.ts`, `.html`, `.scss`
- `src/app/features/sales/sales-workspace.ts`, `.html`, `.scss`, `.spec.ts`
- `src/app/features/settings/settings.ts`, `.html`, `.scss`, `.spec.ts`
- `src/app/shared/components/feedback-message/feedback-message.ts`, `.html`, `.scss`, `.spec.ts`
- `src/app/core/auth/auth.service.spec.ts`
- This guide.

## Modified files
- `src/app/app.routes.ts`
- `src/app/app.config.ts`
- `src/app/core/layout/app-layout/app-layout.ts`
- `src/app/core/layout/app-layout/app-layout.html`
- `src/app/core/layout/app-layout/app-layout.scss`

## Verification
From the project root:

```bash
npx ng test --watch=false
npx ng build
npx ng serve
```

Manual test checklist:
1. Sign in with `admin` / `Admin@123`; confirm it opens Dashboard.
2. Change the admin password in Settings and verify the new password works after sign-out.
3. Create two employees with different usernames.
4. Sign out and sign in as an employee; verify only Sales workspace is visible.
5. Try `/dashboard`, `/products`, `/settings` as an employee; each should redirect to `/sales`.
6. Search for a product by name and barcode; confirm available quantity is visible.
7. Sell a valid quantity; confirm stock decreases and the success message reports remaining stock.
8. Attempt to sell more than the available quantity; confirm the operation is rejected and stock remains unchanged.
9. Disable an employee from Admin Settings; confirm that employee cannot sign in.
10. Sign back in as Admin; verify all original management pages remain available.

The existing pagination component and product-tracking pipe are preserved. This phase does not change their behavior.
