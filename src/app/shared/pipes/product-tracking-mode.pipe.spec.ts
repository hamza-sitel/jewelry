import { ProductTrackingModeLabelPipe } from './product-tracking-mode.pipe';

describe('ProductTrackingModeLabelPipe', () => {
  const pipe = new ProductTrackingModeLabelPipe();

  it('labels weighted jewelry', () => {
    expect(pipe.transform('WEIGHTED')).toBe('Weighted · per-piece weight');
  });

  it('labels piece-based stock', () => {
    expect(pipe.transform('PIECE')).toBe('Piece-based stock');
  });

  it('handles a missing value safely', () => {
    expect(pipe.transform(undefined)).toBe('Unknown tracking mode');
  });
});
