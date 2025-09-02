import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  console.log('🔄 Auth interceptor called for:', req.url);

  // Skip adding token only for endpoints that don't require authentication
  const skipAuthEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
  const shouldSkipAuth = skipAuthEndpoints.some((endpoint) => req.url.includes(endpoint));

  if (shouldSkipAuth) {
    console.log('⏭️ Skipping auth header for public endpoint');
    return next(req);
  }

  const token = authService.token;
  console.log('🔑 Token from service:', token ? 'Present' : 'Not found');

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    console.log('✅ Added Authorization header:', authReq.headers.get('Authorization'));
    return next(authReq);
  }

  console.log('❌ No token found, proceeding without auth header');
  return next(req);
};
