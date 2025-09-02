import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenExpirationTimer: any;

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      // Check if token is expired
      if (!this.isTokenExpiringSoon(token)) {
        this.tokenSubject.next(token);
        this.currentUserSubject.next(JSON.parse(user));
        this.setupTokenRefreshTimer(token);
      } else {
        // Token is expired or about to expire, try to refresh
        this.proactiveTokenRefresh();
      }
    }
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(tap(() => this.handleLogout()));
  }

  logoutAllDevices(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout-all`, {}).pipe(tap(() => this.handleLogout()));
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  getProfile(): Observable<{ message: string; user: User }> {
    return this.http.get<{ message: string; user: User }>(`${this.apiUrl}/me`);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    this.tokenSubject.next(response.accessToken);
    this.currentUserSubject.next(response.user);

    // Set up automatic token refresh
    this.setupTokenRefreshTimer(response.accessToken);
  }

  private handleLogout(): void {
    this.clearTokenRefreshTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // Decode JWT token to get expiration time
  private getTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired or about to expire (within 2 minutes)
  private isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
    return expiration - now < twoMinutes;
  }

  // Set up automatic token refresh timer
  private setupTokenRefreshTimer(token: string): void {
    this.clearTokenRefreshTimer();

    const expiration = this.getTokenExpiration(token);
    if (!expiration) return;

    // Refresh token 2 minutes before expiration
    const refreshTime = expiration - Date.now() - 2 * 60 * 1000;

    if (refreshTime > 0) {
      this.tokenExpirationTimer = setTimeout(() => {
        this.proactiveTokenRefresh();
      }, refreshTime);

      console.log(`🔄 Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);
    } else {
      // Token is already expired or about to expire, refresh immediately
      this.proactiveTokenRefresh();
    }
  }

  // Clear the token refresh timer
  private clearTokenRefreshTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  // Proactively refresh the token
  private proactiveTokenRefresh(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && this.isAuthenticated) {
      console.log('🔄 Proactively refreshing token...');
      this.refreshToken().subscribe({
        next: (response) => {
          console.log('✅ Token refreshed successfully');
        },
        error: (error) => {
          console.error('❌ Failed to refresh token:', error);
          // If refresh fails, logout the user
          this.handleLogout();
        },
      });
    }
  }

  // Check token expiration status
  public checkTokenExpiration(): void {
    const token = this.token;
    if (token && this.isTokenExpiringSoon(token)) {
      this.proactiveTokenRefresh();
    }
  }

  // Get remaining time until token expires (in minutes)
  public getTokenTimeRemaining(): number | null {
    const token = this.token;
    if (!token) return null;

    const expiration = this.getTokenExpiration(token);
    if (!expiration) return null;

    const remainingMs = expiration - Date.now();
    return Math.max(0, Math.round(remainingMs / 1000 / 60)); // Convert to minutes
  }
}
