# Phase 2 — Products, Categories and shared pagination

This archive is an overlay for the existing Angular project. Extract it into the project root so its `src` folder merges with the existing `src` folder. Keep the existing SCSS files: their paths and HTML class names are preserved.

## Product tracking rules

There are two product tracking modes. Both modes support any positive whole-number quantity.

- `PIECE`: the product is counted in pieces and `weight` must be `null`.
- `WEIGHTED`: the product stores a positive **weight per piece**. Its quantity can be 1, 2, 10, or any positive whole number. Total recorded weight is `weight * quantity`.

Example: a product has a per-piece weight of 2.59 g and quantity 4. Its total recorded weight is 10.36 g. This model assumes the units in one product record share the same per-piece weight. When individual pieces have different weights, keep them in separate product records until unit-level inventory is designed.

Both modes support multi-piece purchases, sales, manual additions and manual removals. Quantity is changed through stock operations, not through the normal product edit form. Editing product details cannot change the tracking mode or stock quantity.

## Shared pagination

`src/app/shared/components/pagination` contains one reusable standalone pagination component. Its shared default page size is 20 records.

It is used on:

- Products list
- Categories page's product-type list
- Stock History
- Individual Product Details stock history

Filters reset the visible list to page 1. The component shows the current range and page numbers, with compact ellipses for long page lists. Dashboard's recent-products table remains intentionally limited to five records. Reports pagination will use this same component in Phase 4 when report filters and tables are completed.

## Architecture changes

- Product and catalog services use data-source interfaces and injection tokens.
- Mock data sources continue to use the existing browser-storage service.
- Product create and update request shapes are separate. Update cannot change stock or tracking mode.
- Product storage migration derives tracking mode from the stored per-piece weight and preserves the stored quantity.
- Stock operation validation is tracking-mode independent: both modes can move multiple pieces.
- The mock stock flow still writes product quantity and operation history separately. Phase 3 will move this to one backend stock-operation request and a Spring Boot transaction.

## Shared UI decision

The only new shared UI component is pagination, because the same interaction is genuinely repeated across several data-heavy screens. The tracking-mode label remains a shared pipe. No generic form/table component was introduced just to fill `shared/components`.

## Verification

Expected suite after overlay and existing Phase 1 test fixes: 8 spec files and 21 tests.

```bat
npx ng test --watch=false
npx ng build
git diff --check
```

Then manually confirm that a weighted product can be created with quantity greater than one, that its total weight is calculated as per-piece weight multiplied by quantity, and that stock operations can add/remove more than one piece for both modes.
