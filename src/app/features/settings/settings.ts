import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/auth/auth.service';
import type { UserResponse, UserStatus } from '../../core/auth/auth.model';
import { FeedbackMessage } from '../../shared/components/feedback-message/feedback-message';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, FeedbackMessage, DatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  employees: UserResponse[] = [];
  displayName = '';
  username = '';
  employeePassword = '';
  currentPassword = '';
  newPassword = '';
  isCreatingEmployee = false;
  isChangingPassword = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  get activeEmployeeCount(): number {
    return this.employees.filter(employee => employee.status === 'ACTIVE').length;
  }

  createEmployee(): void {
    this.clearMessages();
    this.isCreatingEmployee = true;
    this.auth.createEmployee({
      displayName: this.displayName,
      username: this.username,
      password: this.employeePassword,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: employee => {
          this.employees = [...this.employees, employee].sort((a, b) => a.displayName.localeCompare(b.displayName));
          this.displayName = '';
          this.username = '';
          this.employeePassword = '';
          this.successMessage = `Employee account for ${employee.displayName} was created.`;
          this.isCreatingEmployee = false;
        },
        error: error => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to create employee account.';
          this.isCreatingEmployee = false;
        },
      });
  }

  changeEmployeeStatus(employee: UserResponse, status: UserStatus): void {
    this.clearMessages();
    this.auth.setEmployeeStatus(employee.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.employees = this.employees.map(item => item.id === updated.id ? updated : item);
          this.successMessage = `${updated.displayName}'s account is now ${updated.status.toLocaleLowerCase()}.`;
        },
        error: error => this.errorMessage = error instanceof Error ? error.message : 'Unable to update employee status.',
      });
  }

  updateMyPassword(): void {
    this.clearMessages();
    this.isChangingPassword = true;
    this.auth.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.currentPassword = '';
          this.newPassword = '';
          this.successMessage = 'Your password was updated.';
          this.isChangingPassword = false;
        },
        error: error => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to update password.';
          this.isChangingPassword = false;
        },
      });
  }

  private loadEmployees(): void {
    this.auth.getEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: employees => this.employees = employees,
        error: error => this.errorMessage = error instanceof Error ? error.message : 'Unable to load employees.',
      });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
