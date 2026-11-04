import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CategoryManagement } from './category-management';

describe('CategoryManagement', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryManagement],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CategoryManagement);

    expect(fixture.componentInstance).toBeTruthy();
  });
});