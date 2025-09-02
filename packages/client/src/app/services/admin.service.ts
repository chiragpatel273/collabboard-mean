import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserRole } from '../models/user.model';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  regularUsers: number;
  inactiveUsers: number;
  recentSignups: number;
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDocuments: number;
    hasMore: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // User Statistics
  getUserStats(): Observable<{ message: string; stats: UserStats }> {
    return this.http.get<{ message: string; stats: UserStats }>(`${this.apiUrl}/users/stats`);
  }

  // User Management
  getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Observable<{ message: string } & PaginatedUsers> {
    return this.http.get<{ message: string } & PaginatedUsers>(
      `${this.apiUrl}/users?page=${page}&limit=${limit}`
    );
  }

  getUserById(userId: string): Observable<{ message: string; user: User }> {
    return this.http.get<{ message: string; user: User }>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserRole(userId: string, role: UserRole): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${userId}/role`, {
      role,
    });
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${userId}/status`, {
      isActive,
    });
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${userId}`);
  }

  searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Observable<{ message: string } & PaginatedUsers> {
    return this.http.get<{ message: string } & PaginatedUsers>(
      `${this.apiUrl}/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  createAdminUser(userData: {
    name: string;
    email: string;
    password: string;
  }): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(`${this.apiUrl}/users/admin`, userData);
  }
}
