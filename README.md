# Phase 3 — Inventory, Stock History, DTOs and Barcode

This ZIP is an overlay for the existing Angular project. It contains a `src` folder at the archive root. Extract it into the repository root with PowerShell `Expand-Archive -Force`.

Read `PHASE-3-IMPLEMENTATION-GUIDE.md` before applying. It explains the DTO design, data flow, local mock behavior, future Spring Boot contract, tests and manual verification.

Included work:
- CreateStockOperationRequest DTO and StockOperationResponse model.
- One stock-operation command contract through an InjectionToken.
- Mock command flow that updates stock, records history and attempts rollback if history storage fails.
- Request validation and 500-character notes limit.
- Stock History search, type/date filters, sorting, product links and 20-row pagination.
- Barcode scanner now uses the same request DTO and prevents duplicate submissions.
- Unit tests for service validation, mock execution/rollback and stock-history filters.

This does not change the product tracking rules: PIECE and WEIGHTED both allow multiple whole-piece quantities. Stock operations remain in pieces, not grams.
