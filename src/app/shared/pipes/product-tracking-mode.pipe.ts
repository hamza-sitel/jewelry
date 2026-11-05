import { Pipe, PipeTransform } from '@angular/core';

import type { ProductTrackingMode } from '../../features/products/product.model';

@Pipe({
  name: 'productTrackingModeLabel',
  standalone: true,
})
export class ProductTrackingModeLabelPipe implements PipeTransform {
  transform(mode: ProductTrackingMode | null | undefined): string {
    switch (mode) {
      case 'WEIGHTED':
        return 'Weighted · per-piece weight';
      case 'PIECE':
        return 'Piece-based stock';
      default:
        return 'Unknown tracking mode';
    }
  }
}
