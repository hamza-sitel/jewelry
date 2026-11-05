import { TestBed } from '@angular/core/testing';
import { FeedbackMessage } from './feedback-message';

describe('FeedbackMessage', () => {
  it('creates the reusable feedback component', async () => {
    await TestBed.configureTestingModule({ imports: [FeedbackMessage] }).compileComponents();
    const fixture = TestBed.createComponent(FeedbackMessage);
    fixture.componentInstance.message = 'Saved successfully.';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Saved successfully.');
  });
});
