import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if error is due to token expiration (401 Unauthorized)
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        return handle401Error(req, next, authService, router);
      }

      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          refreshTokenSubject.next(response.accessToken);

          // Retry the original request with new token
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${response.accessToken}`),
          });

          return next(authReq);
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          refreshTokenSubject.next(null);

          // Refresh token is also expired, logout user
          authService.logout().subscribe({
            complete: () => router.navigate(['/login']),
          });

          return throwError(() => refreshError);
        })
      );
    } else {
      // No refresh token available, logout user
      isRefreshing = false;
      authService.logout().subscribe({
        complete: () => router.navigate(['/login']),
      });
      return throwError(() => new Error('No refresh token available'));
    }
  } else {
    // If refreshing is in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        // Retry original request with new token
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(authReq);
      })
    );
  }
}
