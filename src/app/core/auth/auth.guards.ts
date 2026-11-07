import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(user => user
      ? true
      : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(user => user?.role === 'ADMIN'
      ? true
      : user ? router.createUrlTree(['/sales']) : router.createUrlTree(['/login'])),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(user => user
      ? router.createUrlTree([user.role === 'ADMIN' ? '/dashboard' : '/sales'])
      : true),
  );
};
