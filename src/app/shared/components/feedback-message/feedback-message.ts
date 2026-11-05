import { Component, Input } from '@angular/core';

export type FeedbackTone = 'success' | 'error' | 'info';

@Component({
  selector: 'app-feedback-message',
  standalone: true,
  templateUrl: './feedback-message.html',
  styleUrl: './feedback-message.scss',
})
export class FeedbackMessage {
  @Input() tone: FeedbackTone = 'info';
  @Input() title = '';
  @Input() message = '';
}
