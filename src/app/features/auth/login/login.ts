import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/auth/auth.service';
import { FeedbackMessage } from '../../../shared/components/feedback-message/feedback-message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, FeedbackMessage],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  username = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  submit(): void {
    if (this.isSubmitting) return;
    this.errorMessage = '';
    this.isSubmitting = true;

    this.auth.login({ username: this.username, password: this.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: user => {
          const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const safeReturnUrl = requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')
            ? requestedUrl
            : (user.role === 'ADMIN' ? '/dashboard' : '/sales');
          void this.router.navigateByUrl(safeReturnUrl);
        },
        error: error => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to sign in.';
          this.isSubmitting = false;
        },
      });
  }
}
