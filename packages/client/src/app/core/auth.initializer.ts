import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function initializeAuth() {
  const authService = inject(AuthService);

  return () => {
    // Check token expiration on app startup
    authService.checkTokenExpiration();
    return Promise.resolve();
  };
}
