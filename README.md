# Jewelry Stock Management — Angular Frontend

Angular standalone frontend for a jewelry inventory and sales workspace. The project currently supports a local mock/demo mode and includes a separate HTTP data-source implementation ready to connect to a Spring Boot REST API.

## Features

- Admin and employee authentication flows, role-aware navigation and route guards.
- Employee account creation, account status management and password changes.
- Product catalog with categories and category-specific product types.
- Two inventory tracking modes: `PIECE` (no weight) and `WEIGHTED` (per-piece weight in grams); both support multiple whole pieces.
- Product create, edit, details, archive and restore workflows.
- Barcode lookup and scanning workflow.
- Purchase, sale, manual add and manual remove stock operations with stock history.
- Dashboard metrics and charts.
- Stock and operation reports, filtering, pagination, CSV and Excel export.
- Shared feedback and pagination components.

## Requirements

- Node.js 24 LTS (or a Node release supported by the installed Angular 21 version).
- npm 11.x.

## Install and run

```bash
npm install
npm start
```

The default Angular development URL is `http://localhost:4200`.

## Data mode

Open `src/app/core/config/app-mode.ts`:

```ts
export const APP_DATA_MODE: AppDataMode = 'mock';
```

### Mock mode

Set to `'mock'` to use the existing in-browser mock data sources. This mode is useful for feature development, tests and client demonstrations without a running backend. The mock administrator is seeded on first login:

- Username: `admin`
- Password: `Admin@123`

These are demo-only credentials. Do not use them in a deployed production system. Mock users/records are persisted by `BrowserStorageService` in browser localStorage.

### API mode

Set to `'api'` when the Spring Boot server implements the contracts in `BACKEND-INTEGRATION-GUIDE.md`. Configure the API base URL in `src/app/app.config.ts`:

```ts
{ provide: API_BASE_URL, useValue: 'http://localhost:8080/api' }
```

API mode uses `HttpClient` implementations for authentication/employees, products, catalog data and stock operations. There is no automatic fallback to demo data when an API request fails.

Authentication expects a short-lived access token returned by the API and held in memory, plus a refresh token in a Secure, HttpOnly cookie. Spring Security must enforce permissions server-side and implement refresh-token rotation, CSRF protection and credentialed CORS. Angular guards are not a security boundary.

## Architecture

```text
Page components
    ↓
Application services
    ↓
Data-source interfaces (InjectionToken)
    ├── Mock data sources → BrowserStorageService / mock fixtures
    └── API data sources  → HttpClient → Spring Boot REST API
```

Product, catalog, inventory and authentication pages depend on the application services/contracts, not directly on localStorage or HTTP details. `app.config.ts` selects one complete data-source set through `APP_DATA_MODE`.

## Important business rules

- `PIECE`: weight is `null`; quantity is a positive whole number.
- `WEIGHTED`: weight is positive grams per piece; quantity is still a positive whole number.
- Product editing cannot change the tracking mode or stock quantity.
- Stock quantity changes must be recorded as stock operations.
- A stock operation is recorded in whole pieces, not grams.
- In API mode, `POST /stock-operations` must update the product balance and insert its history record in one backend database transaction.
- Frontend validation improves usability; the backend must repeat all authoritative validation.

## Verification

```bash
npm test
npm run build
```

Run these commands on the development machine after `npm install`. Phase 6 also includes API data-source tests. See `PHASE-6-IMPLEMENTATION-GUIDE.md` for the handover checklist and `MOCK-TO-API-CHECKLIST.md` for the eventual switch and cleanup steps.

## Documentation

- `PHASE-3-IMPLEMENTATION-GUIDE.md`
- `PHASE-4-IMPLEMENTATION-GUIDE.md`
- `PHASE-5-IMPLEMENTATION-GUIDE.md`
- `PHASE-6-IMPLEMENTATION-GUIDE.md`
- `BACKEND-INTEGRATION-GUIDE.md`
- `MOCK-TO-API-CHECKLIST.md`
