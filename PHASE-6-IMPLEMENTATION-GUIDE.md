# Phase 6 — Backend-ready Angular frontend

## Goal

Keep the existing Angular application working with local mock data for development/client demonstrations, while adding a real HTTP implementation that can be selected when a Spring Boot backend is available. This phase does **not** create Spring Boot, MySQL, database migrations, controllers or server code.

## What changed

### New architecture files

- `src/app/core/config/app-mode.ts` — one explicit `mock` / `api` switch.
- `src/app/core/api/api.config.ts` — API base URL injection token and endpoint helper.
- `src/app/core/api/api-request-error.ts` — normalized HTTP error type and fallback messages.
- `src/app/core/api/api-error.interceptor.ts` — normalizes backend errors and clears a rejected access token.
- `src/app/core/api/api-auth.interceptor.ts` — sends credentials and the in-memory bearer access token.
- `src/app/core/auth/api-auth-session.store.ts` — keeps the access token/user in memory only.
- `src/app/core/auth/api-auth-refresh.service.ts` — coalesces concurrent refresh attempts into one request.
- `src/app/core/auth/api-auth-data-source.ts` — HTTP authentication and employee source.
- `src/app/features/products/api/api-product-data-source.ts` — HTTP admin product source plus a separate cost-free sales product projection.
- `src/app/features/products/api/api-product-catalog-data-source.ts` — HTTP categories/types source.
- `src/app/features/inventory/api/api-stock-operation-data-source.ts` — HTTP stock-operation source.

### Existing files changed

- `src/app/app.config.ts` selects all mock implementations or all API implementations from `APP_DATA_MODE`.
- `src/app/core/auth/auth-data-source.ts` and `auth.service.ts` now support asynchronous session restoration and employee loading.
- `src/app/core/auth/auth.guards.ts` restore the session before checking the role.
- `src/app/core/auth/auth.model.ts` includes explicit API session and employee status request DTOs.
- `src/app/core/auth/mock-auth-data-source.ts` continues supporting the demo mode with the updated interface.

### Tests added/updated

- API authentication source tests.
- API product source tests.
- API product catalog source tests.
- API stock-operation source tests.
- Auth service test updated for asynchronous session restoration and employee loading.

## Select a mode

Open `src/app/core/config/app-mode.ts`:

```ts
export const APP_DATA_MODE: AppDataMode = 'mock';
```

- Keep `'mock'` to run without a backend, use the seeded demo administrator, and demonstrate the app.
- Change to `'api'` only when the Spring Boot server implements `BACKEND-INTEGRATION-GUIDE.md`.

In `src/app/app.config.ts`, set `API_BASE_URL` to the backend URL. Default is `http://localhost:8080/api`.

There is no fallback from API to mock. This is intentional: otherwise a failed server request could silently show stale demo data and look like real client data.

## Authentication security model for API mode

The API login/refresh contract returns a short-lived access token in JSON. Angular stores it only in memory. The backend stores a refresh token in a Secure, HttpOnly, SameSite cookie. The API implementation sends `withCredentials` and a bearer access token when available, and shares a single refresh request if concurrent API calls receive `401`. The backend remains responsible for password hashing, token validation/rotation, CSRF protection, account disabling and role enforcement.

The mock mode remains browser-only and must not be used for production authentication. Frontend guards improve navigation only; Spring Security must authorize every protected API request.

## Important stock rule

API stock mutations go through `POST /stock-operations`. The backend calculates the old/new quantities and commits the product update plus history row in one transaction. The API product data source intentionally rejects direct stock-quantity writes so no API path can bypass stock history.

## How to run

```bash
npm install
npm test
npm run build
npm start
```

Use Node.js 24 LTS (or a Node version supported by the installed Angular 21 release) and the npm version recorded in `package.json`.

## Before committing Phase 6

1. Confirm `APP_DATA_MODE` is still `'mock'` for the current demo.
2. Run the full test suite and production build locally.
3. Exercise admin login, employee login, employee management, product create/edit, category/type management, purchase/manual stock changes, sales, history, dashboard, reports and exports.
4. Review `BACKEND-INTEGRATION-GUIDE.md` with the Spring Boot developer.
5. Do not merge into `main` until the final Phase 6 branch passes tests and review.

## Known integration boundary

Dashboard and report pages currently aggregate the product and stock-operation collections in Angular. The API implementations return arrays to preserve the current page/service contracts. For a large production dataset, implement server pagination and report aggregate endpoints together with matching Angular changes; do not change the response from an array to a page object without updating the frontend contract.
