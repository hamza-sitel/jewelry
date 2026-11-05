import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Settings } from './settings';
import { AuthService } from '../../core/auth/auth.service';
import type { UserResponse } from '../../core/auth/auth.model';

const employee: UserResponse = { id: 2, username: 'sara', displayName: 'Sara', role: 'EMPLOYEE', status: 'ACTIVE', createdAt: '2026-11-01T10:00:00.000Z' };

describe('Settings', () => {
  it('loads employee accounts and counts active employees', async () => {
    await TestBed.configureTestingModule({ imports: [Settings], providers: [{ provide: AuthService, useValue: { getEmployees: () => of([employee]), currentUser: null } }] }).compileComponents();
    const fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    expect(fixture.componentInstance.employees).toHaveLength(1);
    expect(fixture.componentInstance.activeEmployeeCount).toBe(1);
  });
});
