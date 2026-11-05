# Phase 4 Implementation Guide — Dashboard and Reports

This package updates Dashboard and Reports on top of the completed Phase 1–3 branches. It does not change product, category, stock-operation or barcode business rules.

## 1. Git and branch safety

The Phase 4 branch must be created from the current Phase 3 branch so it contains all earlier work. Do not merge any phase into `main` yet.

From Cmder:

```bat
cd /d D:\jewelry\jewelry-stock-frontend
git branch --show-current
git status --short --branch
```

If Phase 3 documentation is still uncommitted, commit it before creating Phase 4:

```bat
git add README.md PHASE-3-IMPLEMENTATION-GUIDE.md
git commit -m "docs: add phase 3 implementation guide"
```

Then create Phase 4:

```bat
git switch -c feat/phase-4-dashboard-reports
```

If the branch already exists, use `git switch feat/phase-4-dashboard-reports` instead.

## 2. Back up and extract

This phase reads products and stock operations. It does not migrate or clear browser storage. Still keep the localStorage backup you made for earlier phases.

Download `phase-4-dashboard-reports.zip` into the Windows Downloads folder and extract it into the repository root (not into `src`):

```bat
powershell -NoProfile -Command "Expand-Archive -LiteralPath (Join-Path $env:USERPROFILE 'Downloads\phase-4-dashboard-reports.zip') -DestinationPath 'D:\jewelry\jewelry-stock-frontend' -Force"
```

`-Force` overwrites only matching paths. Unrelated project files remain. This overlay replaces the root `README.md` with a Phase 4 summary and adds this guide; keep the earlier phase guides in the repository.

## 3. Files in this phase

| File | Responsibility |
|---|---|
| `features/dashboard/dashboard/dashboard.ts` | Loads product and operation responses and derives dashboard metrics/chart points. |
| `features/dashboard/dashboard/dashboard.html` | Dashboard layout and chart presentation. |
| `features/dashboard/dashboard/dashboard.scss` | Warm Atelier visual styling and responsive chart layout. |
| `features/dashboard/dashboard/dashboard.spec.ts` | Tests metrics, category distribution and movement chart data. |
| `features/reports/reports.ts` | Report filters, sorting, summaries, client-side pagination and export row mapping. |
| `features/reports/reports.html` | Stock and operation reports, charts, filters and tables. |
| `features/reports/reports.scss` | Complete report styling, tables, filters, charts and pagination. |
| `features/reports/reports.spec.ts` | Tests report calculations, filters and pagination. |

No new npm package is added. Charts are rendered with CSS and native SVG. The existing `ReportExportService` remains in place and continues using the project's existing `xlsx` dependency. The existing shared `Pagination` component is imported into Reports.

## 4. How to think before writing code

Use the same engineering sequence for every feature:

1. **Requirement:** what does the user need to understand or do?
2. **Source data:** which existing application responses already contain the information?
3. **Business definitions:** what exactly does each metric mean?
4. **Calculation:** how should the values be aggregated?
5. **Presentation model:** what shape makes the values convenient for a chart or table?
6. **UI:** how should the result be displayed and filtered?
7. **Tests:** which known inputs should produce which results?

### Why this phase does not add a new API DTO

Dashboard and Reports currently combine two existing read models:

- `ProductResponse` from `ProductService.getProducts()`.
- `StockOperationResponse` (also exported as `StockOperation`) from `StockOperationService.getOperations()`.

The frontend derives its charts and summaries from those existing responses. There is no new HTTP endpoint in this phase and no new request crossing an API boundary, so adding an unused `DashboardDto` or `ReportDto` would add ceremony without solving a real problem.

The small interfaces `CategoryMetric`, `DailyMovement`, `OperationMixMetric`, `ChartPoint`, `CategoryShare` and `OperationShare` are **local view models**. They describe shapes used inside the frontend to render a chart. They are not API DTOs and are not persisted entities.

When a backend dashboard endpoint is actually designed, a meaningful response contract could look like this:

```ts
export interface DashboardSummaryResponse {
  activeProductCount: number;
  archivedProductCount: number;
  totalPieces: number;
  recordedWeight: number;
  inventoryPurchaseValue: number;
  potentialSaleValue: number;
  categoryDistribution: Array<{
    categoryId: number;
    categoryName: string;
    pieces: number;
  }>;
  dailyMovements: Array<{
    date: string;
    purchases: number;
    sales: number;
    manualAdditions: number;
    manualRemovals: number;
  }>;
}
```

This is a future example only, not a file we add now. First decide that the backend really needs to provide a summary endpoint; then agree its fields with the backend. Do not duplicate metrics on the server and client without a reason.

For a future server-filtered report, filters may be passed as query parameters rather than a request body, e.g. `GET /api/reports/stock?status=ACTIVE&page=0&size=20`. The response would then need a page envelope containing `content`, `page`, `size`, and `totalElements`. Phase 4 uses client-side filtering because the mock data source currently returns the complete local collection.

## 5. Dashboard calculations and chart explanations

### KPI definitions

- **Active products:** number of product records with status `ACTIVE`.
- **Total pieces:** sum of `quantity` for active product records.
- **Inventory purchase value:** sum of `quantity × purchasePrice` for active products.
- **Potential sale value:** sum of `quantity × salePrice` for active products.
- **Potential gross margin:** potential sale value minus purchase value. This is not realized profit.
- **Low stock:** active product records with quantity greater than zero and less than or equal to 3.
- **Out of stock:** active product records with quantity equal to zero.
- **Recorded weight:** sum of `weight per piece × quantity`; products without a recorded weight contribute zero.

### Four chart forms

1. **Doughnut:** `categoryChartBackground` turns category percentages into CSS conic-gradient segments.
2. **Horizontal bars:** each category quantity is divided by the largest category quantity to produce a proportional width.
3. **Curved line/area:** operation quantities are grouped into the last seven local calendar days. Purchase and sale points are converted to SVG coordinates and connected with cubic Bézier curves. The shaded area follows the sales line. This is a display interpolation; the underlying data remains daily totals.
4. **Stacked bar:** all recorded movement quantities are grouped by PURCHASE, SALE, MANUAL_ADD and MANUAL_REMOVE. Each segment's width is its share of total moved pieces.

The line chart intentionally shows an empty state if no operations occurred during the last seven days. It does not invent a trend from old records. The stacked operation chart uses all available history.

### Why we use native SVG/CSS

The charts in this phase are fixed, purpose-built visualizations. SVG provides scalable paths, axes and points; CSS conic gradients and flex segments provide doughnut and stacked bars. This avoids adding a chart dependency just for four straightforward visualizations. If the application later needs complex zooming, hundreds of series or advanced drill-down, we can reassess a chart library.

## 6. Reports, filters and pagination

The Reports component keeps two data sets: all products and all stock operations.

For each report:

1. Filter the full array by search and selected fields.
2. Sort the filtered array.
3. Slice the sorted array to get the current page.
4. Render the page slice in the table.
5. Export the full filtered array, not the visible page only.

This distinction matters. If a filtered report has 47 rows and page size is 20, the table displays 20 rows at a time, but CSV/Excel exports all 47 matching rows.

The shared `Pagination` component is controlled by the Reports page:

- `totalItems` receives the filtered result count.
- `pageSize` is 20.
- `currentPage` is the selected page.
- `pageChange` updates the corresponding page state.

Every filter and sort change resets its page to 1 so the table cannot remain on a page number that no longer exists.

## 7. Important reporting accuracy

Current product prices are used to estimate the value of stock still held. A sale stock operation records a quantity movement, but it does not contain a complete sales invoice, sale price at time of sale, discount, tax, refund or cost-of-goods-sold record.

Therefore:

- Current inventory sale value is a potential value, not sales revenue.
- Potential gross margin on current inventory is not realized profit.
- Purchase/sale quantity charts show pieces moved, not money earned.
- Real revenue, realized gross profit and period financial statements belong after a proper Sales/Invoices phase with transaction-level data.

## 8. Verify after extraction

Run each command separately in Cmder:

```bat
npx ng test --watch=false
```

Expected based on the Phase 3 baseline: **12 test files, 40 tests, zero failures** (32 previous tests + 4 Dashboard tests + 4 Reports tests).

```bat
npx ng build
```

```bat
git diff --check
```

```bat
git status --short
```

The only changed paths should be the Dashboard/Reports source and tests, plus root `README.md` and `PHASE-4-IMPLEMENTATION-GUIDE.md`. Existing LF/CRLF conversion warnings on Windows are line-ending notices; check that `git diff --check` reports no actual whitespace errors.

## 9. Manual browser verification

### Dashboard

1. Open Dashboard and refresh. KPI values should load from products and operations.
2. Verify product records include active and archived records, but inventory totals use active products only.
3. Verify low stock is quantity 1–3, while zero quantity appears under out-of-stock.
4. Verify weighted total: e.g. quantity 4 × 2.590 g = 10.360 g.
5. Check doughnut shares add to approximately 100% (rounding may cause a small display difference).
6. Check category bars follow the quantity comparison.
7. Create a purchase/sale dated today and verify the seven-day line chart updates after refresh.
8. With no operations in the last seven days, the line chart should show its empty state.
9. Verify the stacked chart groups purchase, sale and manual stock movements.
10. Check recent operation/product links and responsive layout on a narrow screen.

### Reports

1. Stock report: search by name/barcode, select category/status and change sort order.
2. Verify the summary cards update when stock filters change.
3. Verify the doughnut is based on filtered quantities and category bars show filtered purchase value.
4. Create more than 20 matching products and verify page 2 displays the remaining rows.
5. Change a filter while on page 2; pagination should return to page 1.
6. Export CSV/Excel on page 1 and confirm the exported file contains all filtered rows, not just 20.
7. Operation report: filter by operation type, date range and search text; verify totals and stacked chart update.
8. Create more than 20 matching operations, verify pagination and that export contains all filtered operations.
9. Confirm labels say potential value/margin, not realized profit/revenue.

## 10. Commit Phase 4 after tests and browser checks pass

```bat
git add src
git commit -m "feat: add dashboard analytics and reports"
```

Then commit root documentation:

```bat
git add README.md PHASE-4-IMPLEMENTATION-GUIDE.md
git commit -m "docs: add phase 4 dashboard and reports guide"
```

Verify:

```bat
git status --short --branch
git log -3 --oneline --decorate
```

Keep `feat/phase-4-dashboard-reports` separate. Do not merge it into `main` or merge earlier phase branches at this stage.
