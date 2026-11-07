# Jewelry Stock Frontend — Spring Boot API Contract

**Purpose:** This document defines the HTTP contract expected by the Angular API data sources. It is a frontend integration specification, not an implemented backend. The Spring Boot developer should implement these endpoints and response shapes, or update the Angular API data sources deliberately if the backend chooses different conventions.

## 1. Integration overview

The frontend supports two data modes selected in `src/app/core/config/app-mode.ts`:

```ts
export const APP_DATA_MODE: AppDataMode = 'mock'; // 'mock' | 'api'
```

- `mock`: existing local mock implementations and `BrowserStorageService` are registered. This is suitable for local development and controlled client demonstrations.
- `api`: HTTP implementations are registered. No mock fallback is attempted. A failed API request is shown as an error; it never silently reads or writes local mock data.

The pages/components call the existing application services. Services depend on data-source interfaces, and Angular dependency injection selects the implementation. Changing modes should not require rewriting product, inventory, sales, dashboard, report or settings pages.

The base API URL is configured in `src/app/app.config.ts` using `API_BASE_URL`:

```ts
{ provide: API_BASE_URL, useValue: 'http://localhost:8080/api' }
```

Change this value for the backend host. The API source classes add endpoint paths to this base URL.

## 2. General API conventions

- Base path: `/api`.
- JSON property naming: `camelCase`, matching the TypeScript contracts.
- IDs: positive integer values represented as JSON numbers.
- Dates: ISO-8601 strings with timezone, preferably UTC, for example `2026-11-07T10:30:00.000Z`.
- Money and weights: JSON numbers. Weight is the **per-piece** weight in grams; quantity remains a whole-piece count.
- Nullable values: use JSON `null`, not an omitted field, for `weight` on piece-tracked products and `imageUrl`/`notes` when absent.
- Collection endpoints currently return full JSON arrays. The present pages perform filtering and pagination in the frontend. For large production datasets, introduce a `PageResponse<T>` contract and update the corresponding pages/data-source interfaces together; do not start returning a paginated object to a source that currently expects an array.
- Successful create/update operations return the created/updated resource directly unless the endpoint below says `204 No Content`.
- Errors use the shared error DTO described in section 10.

## 3. Authentication and employees

### Session design

The API implementation expects:

- A short-lived access token returned in the JSON response and held **in memory only** by Angular.
- A refresh token stored by the backend in a `Secure`, `HttpOnly`, appropriately `SameSite` cookie.
- The backend rotates/revokes refresh tokens and clears the cookie on logout.
- Angular sends credentials (`withCredentials: true`) and adds `Authorization: Bearer <accessToken>` when it has an in-memory access token.
- Angular does not persist API tokens or employee passwords in localStorage.

`HttpOnly` refresh cookies, CSRF protection, secure cookie flags, token expiry and role enforcement must be implemented by Spring Security. A client-side route guard is only navigation/UI protection; it is not authorization.

### DTOs

`LoginRequest`:

```json
{ "username": "admin", "password": "example-password" }
```

`AuthSessionResponse`:

```json
{
  "accessToken": "short-lived-access-token",
  "user": {
    "id": 1,
    "username": "admin",
    "displayName": "Store Administrator",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-11-07T10:30:00.000Z"
  }
}
```

`UserResponse` fields: `id`, `username`, `displayName`, `role` (`ADMIN` or `EMPLOYEE`), `status` (`ACTIVE` or `DISABLED`), `createdAt`.

### Endpoints

| Method | Endpoint | Request | Success response | Access |
|---|---|---|---|---|
| `POST` | `/auth/login` | `LoginRequest` | `AuthSessionResponse` + refresh cookie | Public |
| `POST` | `/auth/refresh` | `{}` | `AuthSessionResponse` + rotated refresh cookie | Valid refresh cookie |
| `POST` | `/auth/logout` | `{}` | `204 No Content`; clear refresh cookie | Authenticated |
| `GET` | `/employees` | — | `UserResponse[]` | `ADMIN` |
| `POST` | `/employees` | `CreateEmployeeRequest` | `UserResponse` | `ADMIN` |
| `PATCH` | `/employees/{id}/status` | `UpdateEmployeeStatusRequest` | `UserResponse` | `ADMIN` |
| `PATCH` | `/auth/password` | `ChangePasswordRequest` | `204 No Content` | Authenticated |

`CreateEmployeeRequest`:

```json
{ "username": "sara", "displayName": "Sara", "password": "strong-password" }
```

The request intentionally does **not** include `role`; the backend must assign `EMPLOYEE` and must never trust a client-supplied role for employee creation.

`UpdateEmployeeStatusRequest`:

```json
{ "status": "DISABLED" }
```

`ChangePasswordRequest`:

```json
{ "currentPassword": "old-password", "newPassword": "new-password" }
```

The frontend route guard protects admin pages, but Spring Security must also enforce roles on every employee-management endpoint. A disabled account must be rejected by the backend even if an old browser tab remains open.

## 4. Product DTOs and endpoints

Product tracking rules are part of the business contract:

- `PIECE`: `weight` must be `null`; quantity is a positive whole number.
- `WEIGHTED`: `weight` is a positive per-piece gram value; quantity is still a positive whole number and may be greater than one.
- Total weight is derived as `weight × quantity`; do not store quantity as grams.
- Product editing must not change `trackingMode` or stock quantity.
- Stock quantity changes through stock operations only.

`CreateProductRequest` example:

```json
{
  "name": "Gold ring",
  "categoryId": 1,
  "typeId": 3,
  "trackingMode": "WEIGHTED",
  "weight": 2.59,
  "quantity": 4,
  "purchasePrice": 850,
  "salePrice": 1200,
  "imageUrl": null
}
```

`ProductResponse` adds server-owned fields:

```json
{
  "id": 42,
  "barcode": "JWL000042",
  "name": "Gold ring",
  "categoryId": 1,
  "categoryName": "18K Gold",
  "typeId": 3,
  "typeName": "Ring",
  "trackingMode": "WEIGHTED",
  "weight": 2.59,
  "quantity": 4,
  "purchasePrice": 850,
  "salePrice": 1200,
  "imageUrl": null,
  "status": "ACTIVE",
  "createdAt": "2026-11-07T10:30:00.000Z"
}
```

`UpdateProductRequest` contains only editable details: `name`, `categoryId`, `typeId`, `weight`, `purchasePrice`, `salePrice`, `imageUrl`. It does not contain quantity or tracking mode.

| Method | Endpoint | Request | Success response | Access |
|---|---|---|---|---|
| `GET` | `/products` | — | `ProductResponse[]` | `ADMIN` |
| `GET` | `/products/{id}` | — | `ProductResponse` | `ADMIN` |
| `GET` | `/products/barcode/{barcode}` | — | `ProductResponse` | `ADMIN` |
| `POST` | `/products` | `CreateProductRequest` | `ProductResponse` | `ADMIN` |
| `PATCH` | `/products/{id}` | `UpdateProductRequest` | `ProductResponse` | `ADMIN` |
| `PATCH` | `/products/{id}/archive` | `{}` | `ProductResponse` | `ADMIN` |
| `PATCH` | `/products/{id}/restore` | `{}` | `ProductResponse` | `ADMIN` |
| `GET` | `/sales/products` | — | `SellableProductResponse[]` | `ADMIN`, `EMPLOYEE` |

The employee sales workspace does not use the admin product response. It calls `GET /sales/products`, which returns `SellableProductResponse[]` with only `id`, `barcode`, `name`, `categoryName`, `typeName`, `trackingMode`, `weight`, `quantity` and `status`. It must not expose `purchasePrice`, `salePrice`, or other management-only fields unless the business explicitly decides employees need them. This endpoint is available to authenticated `ADMIN` and `EMPLOYEE` users; filter to active/sellable records server-side.

Example employee-safe response:

```json
[
  {
    "id": 42,
    "barcode": "JWL000042",
    "name": "Gold ring",
    "categoryName": "18K Gold",
    "typeName": "Ring",
    "trackingMode": "WEIGHTED",
    "weight": 2.59,
    "quantity": 4,
    "status": "ACTIVE"
  }
]
```

A not-found product lookup may return `404`; the Angular data source maps that to `undefined` for the existing page/service contract. Other errors remain errors.

The API data source deliberately does not call a direct `PATCH /products/{id}/stock` endpoint. In API mode, `ProductService.updateStockQuantity` is not an independent write path: stock is changed by the transactional stock-operation endpoint only. This avoids creating stock quantities with no corresponding history record.

## 5. Categories and product types

`ProductCatalogSnapshot`:

```json
{
  "categories": [{ "id": 1, "name": "18K Gold" }],
  "types": [{ "id": 3, "categoryId": 1, "name": "Ring" }]
}
```

Requests:

- `CreateCategoryRequest` / `UpdateCategoryRequest`: `{ "name": "18K Gold" }`
- `CreateProductTypeRequest`: `{ "categoryId": 1, "name": "Ring" }`
- `UpdateProductTypeRequest`: `{ "name": "Necklace" }`

| Method | Endpoint | Request | Success response |
|---|---|---|---|
| `GET` | `/catalog` | — | `ProductCatalogSnapshot` |
| `POST` | `/categories` | `CreateCategoryRequest` | `ProductCategoryResponse` |
| `PATCH` | `/categories/{id}` | `UpdateCategoryRequest` | `ProductCategoryResponse` |
| `POST` | `/product-types` | `CreateProductTypeRequest` | `ProductTypeResponse` |
| `PATCH` | `/product-types/{id}` | `UpdateProductTypeRequest` | `ProductTypeResponse` |

The server must validate unique category names, unique type names within a category, category/type relationships and whether a category/type is already referenced by products before destructive changes. The current UI adds types to categories explicitly; do not create a category without allowing its types to be managed.

## 6. Inventory and stock-operation DTOs

`CreateStockOperationRequest` is intentionally small:

```json
{
  "productId": 42,
  "type": "SALE",
  "quantity": 1,
  "notes": null
}
```

Allowed `type` values: `PURCHASE`, `SALE`, `MANUAL_ADD`, `MANUAL_REMOVE`.

The server calculates and returns `StockOperationResponse`:

```json
{
  "id": 901,
  "productId": 42,
  "productName": "Gold ring",
  "barcode": "JWL000042",
  "type": "SALE",
  "quantity": 1,
  "previousStock": 4,
  "newStock": 3,
  "createdAt": "2026-11-07T10:30:00.000Z",
  "notes": null
}
```

| Method | Endpoint | Request | Success response |
|---|---|---|---|
| `GET` | `/stock-operations` | optional `?productId={id}` | `StockOperationResponse[]` | `ADMIN` (or an explicitly scoped history permission) |
| `POST` | `/stock-operations` | `CreateStockOperationRequest` | `StockOperationResponse` | `ADMIN` for non-sale operations; `ADMIN` or `EMPLOYEE` only when `type` is `SALE` |

**Critical backend rule:** `POST /stock-operations` must run in one database transaction. Load/lock the product row, verify the product exists and is active, calculate `previousStock` and `newStock`, reject a negative result, update product quantity, insert history, then return the response. A failure at any step must roll back all changes. Use `@Transactional` and a concurrency strategy such as optimistic versioning or row locking. The frontend must never calculate authoritative stock balances.

`SALE` is the employee sales workflow and must use this same operation pathway. Do not add a separate stock decrement endpoint for the sales page.

## 7. Dashboard and reports

The current dashboard and reports are client-side read models built from the product and stock-operation services. API mode therefore uses:

- `GET /products`
- `GET /stock-operations`

The Angular pages calculate summary cards, charts, filters, movement mixes, stock-health indicators and exports from these responses. Employee sales uses the separate `GET /sales/products` projection and does not request the admin product collection. The backend should return all records required by the present frontend contract. For a larger shop/history, replace full-list reads with dedicated aggregate/report endpoints and paginated query DTOs in a later coordinated frontend/backend change.

The current inventory potential margin is an estimate based on current stock and price fields; it is not realized profit or accounting revenue. Sales history is based on stock-operation records; the current model is not a full invoice/payment ledger.

## 8. Roles and permissions

| Capability | `ADMIN` | `EMPLOYEE` |
|---|---:|---:|
| Dashboard, products, categories, inventory, barcode, reports, settings | Yes | No |
| Manage employees | Yes | No |
| Create stock operation with type `SALE` through sales workspace | Yes | Yes |
| Read current product availability for sale (`GET /sales/products`) | Yes | Yes |
| Other stock operation types | Yes | No |

The backend must verify the authenticated principal and role on every protected endpoint. Do not trust a role value supplied by the browser, route, request body or local storage. The employee API can expose only the product fields needed for selling if the backend requires tighter data minimization.

## 9. Suggested relational data model (backend design proposal)

These are proposed persistence entities, not Angular classes or existing database tables:

- `app_user`: unique username, password hash, display name, role, account status, timestamps.
- `product_category`: unique name, timestamps.
- `product_type`: category foreign key, name; unique `(category_id, normalized_name)`.
- `product`: barcode (unique), name, category/type foreign keys, tracking mode, nullable per-piece weight, quantity, purchase/sale prices, image URL, status, version, timestamps.
- `stock_operation`: product foreign key, operation type, quantity, previous stock, new stock, notes, actor/user foreign key, timestamp.
- `refresh_token` or equivalent server-side session record: user foreign key, token hash, expiry, revocation/rotation metadata. Never store a raw refresh token in a publicly readable table/field.

Important constraints:

- `product.quantity` is a non-negative integer.
- For `PIECE`, `weight IS NULL`; for `WEIGHTED`, `weight > 0`.
- `stock_operation.quantity > 0` and `previous_stock >= 0` and `new_stock >= 0`.
- `product.barcode` and normalized usernames are unique.
- A stock operation stores the actor and timestamp for auditability.
- Consider soft archive for categories/types/products already referenced by historical records.
- Use database transactions for stock mutation and history insertion.
- Store timestamps consistently (UTC) and use decimal database types for prices and weights rather than binary floating-point columns. Define currency (the frontend currently displays DH/MAD) in the backend/domain configuration.

## 10. Standard API error DTO

Expected shape (matching `ApiErrorResponse`):

```json
{
  "timestamp": "2026-11-07T10:30:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/products",
  "fieldErrors": {
    "weight": "Weight must be greater than zero"
  }
}
```

Angular's HTTP error interceptor converts transport/backend errors to `ApiRequestError`, preserving `status`, `fieldErrors`, `path` and the server message. Common statuses are interpreted as follows: `400` validation/business rule, `401` missing/expired authentication, `403` insufficient permissions, `404` missing resource, `409` unique/concurrency conflict, and `5xx` unexpected server failure.

## 11. Local development and CORS

When Angular runs at `http://localhost:4200` and Spring Boot at `http://localhost:8080`, configure CORS for the exact frontend origin with credentials enabled. Do not use `Access-Control-Allow-Origin: *` with credentialed requests. Configure allowed methods and headers including `Authorization` and the CSRF header chosen by the backend.

For cookie-based refresh sessions, implement CSRF protection in Spring Security. A same-origin development proxy can simplify browser cookie/XSRF behavior; otherwise agree on a CSRF token endpoint/cookie/header contract with the backend developer before enabling cross-origin production use.

## 12. First integration checklist

1. Implement the endpoints and exact DTO shapes above in Spring Boot.
2. Implement role checks and business validation server-side.
3. Implement access-token issuance, refresh-token cookie rotation, logout revocation and CSRF protection.
4. Configure CORS and verify credentials/cookies from the Angular origin.
5. Start the API and test `/auth/login`, `/auth/refresh`, `/auth/logout` before switching the whole app.
6. Change `APP_DATA_MODE` to `'api'` and configure `API_BASE_URL`.
7. Verify admin and employee route behavior; then verify all CRUD and stock flows.
8. Disable mock mode in production builds and never use the demo administrator credentials in a deployed system.
