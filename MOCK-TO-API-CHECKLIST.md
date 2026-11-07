# Mock-to-API switch and post-backend cleanup checklist

## While the backend is not ready

- Keep `APP_DATA_MODE = 'mock'` in `src/app/core/config/app-mode.ts`.
- Keep all `Mock*DataSource` classes and mock fixtures. They power local development and client demonstrations.
- Use only fictional/demo records in browser storage. Clear `jewelry-stock.*` localStorage keys when a clean demo is needed.
- Never present mock data as live synchronized store data.

## When the backend is ready

1. Confirm every endpoint and DTO in `BACKEND-INTEGRATION-GUIDE.md` is implemented and tested.
2. Confirm Spring Security validates tokens and authorizes every route/action; Angular guards are not a security boundary.
3. Confirm refresh cookie flags, CORS credentials and CSRF protection are correctly configured.
4. Set `API_BASE_URL` in `src/app/app.config.ts` to the real backend URL.
5. Change `APP_DATA_MODE` from `'mock'` to `'api'`.
6. Run tests/build and test all workflows against the real server.
7. Use a production configuration/release process that selects API mode; never deploy the mock administrator login as real authentication.

## What to keep

Keep in the repository:

- `ProductDataSource`, `ProductCatalogDataSource`, `StockOperationDataSource`, and `AuthDataSource` interfaces.
- Application services, page components, DTOs, models, guards, interceptors and HTTP data sources.
- Mock data sources and mock fixtures if the team still wants a demo/test mode.
- Mock-specific unit tests and test fixtures.

## What can be retired later

Only remove mock-specific files if the team decides it no longer needs mock/demo mode:

- `mock-auth-data-source.ts`
- `mock-product-data-source.ts` and `product.mock.ts`
- `mock-product-catalog-data-source.ts` and `product-catalog.mock.ts`
- `mock-stock-operation-data-source.ts`
- Mock-specific test fixtures/tests that no longer serve a test purpose
- `BrowserStorageService` only if a code search confirms no other feature uses it

Do **not** remove the data-source interfaces or application services. Do not remove `BrowserStorageService` blindly: it may still be useful for non-sensitive UI preferences. Do not remove test mocks simply because API mode is used in production; test doubles remain valuable for isolated unit tests.

## Data migration warning

Browser localStorage records do not automatically become database rows. Before switching an existing shop from mock data to the backend, design and execute a deliberate import/migration with validation and backups. Do not automatically upload demo localStorage records on first login.
