# Phase 4 — Dashboard and Reports

This is an overlay for the existing Jewelry Stock Management Angular project. Extract it into the repository root with PowerShell `Expand-Archive -Force`.

## Included

- Dashboard uses existing `ProductResponse` and `StockOperationResponse` data.
- Inventory KPI calculations for active pieces, current inventory values, recorded weight, low stock and out-of-stock records.
- Category doughnut chart, category quantity bars, smooth seven-day purchase/sale curves, and a stacked operation-mix bar.
- Recent products and stock operations.
- Reports redesign with stock and operation summaries, category composition, purchase-value comparison, and movement mix.
- Search, category/status/type/date filters, sorting and shared 20-row pagination.
- CSV and Excel exports include every filtered record, not just the visible page.
- Dashboard and Reports component tests.

## Important data rules

- Low stock is 1–3 pieces (the store's chosen threshold).
- Both `PIECE` and `WEIGHTED` products are counted in whole pieces.
- Weighted total is per-piece weight × current quantity.
- Inventory purchase/sale values are estimates from current product prices and quantity.
- Potential gross margin on current stock is not realized profit from completed sales.
- The movement line chart shows purchases and sales for the last seven calendar days. If there are no movements in that period, the UI shows an empty state rather than inventing a trend.

## No new dependency

Charts use native SVG and CSS. Reports continue using the existing `ReportExportService` and existing `xlsx` dependency. The existing shared `Pagination` component is reused.

Read `PHASE-4-IMPLEMENTATION-GUIDE.md` before applying and testing the overlay.
