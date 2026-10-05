import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiService } from '../services/api.service.js';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const api = inject(ApiService);
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('group_jwt') || localStorage.getItem('flat_jwt')) : null;

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // Do not auto-logout if the request was to /auth/login or /invites (let caller handle wrong password / invalid otp)
        const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/invites/');
        if (!isAuthEndpoint) {
          api.logout();
          router.navigate(['/auth']);
        }
      }
      return throwError(() => err);
    }),
  );
};

