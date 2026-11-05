import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get currentUser() {
    return this.auth.currentUser;
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
