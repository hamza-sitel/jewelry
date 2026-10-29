import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcodeScan } from './barcode-scan';

describe('BarcodeScan', () => {
  let component: BarcodeScan;
  let fixture: ComponentFixture<BarcodeScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeScan],
    }).compileComponents();

    fixture = TestBed.createComponent(BarcodeScan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
