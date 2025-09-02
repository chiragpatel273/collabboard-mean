import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/user.model';
import { AdminService, PaginatedUsers } from '../../../services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management">
      <div class="header">
        <h1>User Management</h1>
        <div class="header-actions">
          <div class="search-box">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup)="onSearch()"
              placeholder="Search users..."
              class="search-input"
            />
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>

      <div class="users-table-container">
        <table class="users-table" *ngIf="users.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select
                  [value]="user.role"
                  (change)="updateUserRole(user, $event)"
                  class="role-select"
                  [disabled]="updatingUsers.has(user._id)"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <span class="status-badge" [class]="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                {{ user.lastLogin ? (user.lastLogin | date: 'short') : 'Never' }}
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn btn-sm"
                    [class]="user.isActive ? 'btn-warning' : 'btn-success'"
                    (click)="toggleUserStatus(user)"
                    [disabled]="updatingUsers.has(user._id)"
                    [title]="user.isActive ? 'Deactivate user' : 'Activate user'"
                  >
                    <i class="fas" [class]="user.isActive ? 'fa-user-times' : 'fa-user-check'"></i>
                    {{ user.isActive ? 'Deactivate' : 'Activate' }}
                  </button>

                  <button
                    class="btn btn-sm btn-danger"
                    (click)="confirmDeleteUser(user)"
                    [disabled]="updatingUsers.has(user._id)"
                    title="Delete user"
                  >
                    <i class="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="pagination">
          <button
            class="btn btn-sm"
            (click)="goToPage(pagination.currentPage - 1)"
            [disabled]="pagination.currentPage === 1 || loading"
          >
            <i class="fas fa-chevron-left"></i> Previous
          </button>

          <span class="page-info">
            Page {{ pagination.currentPage }} of {{ pagination.totalPages }} ({{
              pagination.totalDocuments
            }}
            total users)
          </span>

          <button
            class="btn btn-sm"
            (click)="goToPage(pagination.currentPage + 1)"
            [disabled]="!pagination.hasMore || loading"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && users.length === 0">
        <div class="empty-icon">
          <i class="fas fa-users"></i>
        </div>
        <h3>No users found</h3>
        <p *ngIf="searchQuery">No users match your search criteria.</p>
        <p *ngIf="!searchQuery">No users are currently registered in the system.</p>
      </div>

      <div class="error-message" *ngIf="error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadUsers()"><i class="fas fa-redo"></i> Retry</button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="userToDelete" (click)="cancelDelete()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete user <strong>{{ userToDelete.name }}</strong
            >?
          </p>
          <p class="warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
          <button
            class="btn btn-danger"
            (click)="deleteUser(userToDelete)"
            [disabled]="deletingUser"
          >
            <i class="fas fa-trash"></i>
            {{ deletingUser ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .user-management {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .search-box {
        position: relative;
      }

      .search-input {
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
        width: 300px;
        transition: border-color 0.2s ease;
      }

      .search-input:focus {
        outline: none;
        border-color: #6366f1;
      }

      .search-icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
      }

      .users-table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .users-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-table th,
      .users-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #f3f4f6;
      }

      .users-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
      }

      .users-table tr:hover {
        background: #f9fafb;
      }

      .role-select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.85rem;
        background: white;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .status-badge.active {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.inactive {
        background: #fee2e2;
        color: #991b1b;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
      }

      .btn-success {
        background: #10b981;
        color: white;
      }

      .btn-success:hover:not(:disabled) {
        background: #059669;
      }

      .btn-warning {
        background: #f59e0b;
        color: white;
      }

      .btn-warning:hover:not(:disabled) {
        background: #d97706;
      }

      .btn-danger {
        background: #ef4444;
        color: white;
      }

      .btn-danger:hover:not(:disabled) {
        background: #dc2626;
      }

      .btn-secondary {
        background: #6b7280;
        color: white;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #4b5563;
      }

      .pagination {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
        border-top: 1px solid #f3f4f6;
      }

      .page-info {
        font-size: 0.9rem;
        color: #6b7280;
      }

      .loading,
      .empty-state,
      .error-message {
        padding: 3rem;
        text-align: center;
      }

      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .empty-state .empty-icon {
        font-size: 3rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .empty-state p {
        color: #6b7280;
      }

      .error-message {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .retry-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-top: 1rem;
      }

      .retry-btn:hover {
        background: #b91c1c;
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .modal-header {
        padding: 1.5rem 1.5rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-btn:hover {
        background: #f3f4f6;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-body p {
        margin: 0 0 1rem 0;
        color: #374151;
      }

      .warning {
        color: #dc2626 !important;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .modal-footer {
        padding: 0 1.5rem 1.5rem;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      @media (max-width: 768px) {
        .user-management {
          padding: 1rem;
        }

        .header {
          flex-direction: column;
          align-items: stretch;
        }

        .search-input {
          width: 100%;
        }

        .users-table-container {
          overflow-x: auto;
        }

        .users-table {
          min-width: 800px;
        }

        .action-buttons {
          flex-direction: column;
          align-items: flex-start;
        }

        .pagination {
          flex-direction: column;
          gap: 1rem;
        }
      }
    `,
  ],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  pagination: PaginatedUsers['pagination'] | null = null;
  loading = false;
  error: string | null = null;
  searchQuery = '';
  updatingUsers = new Set<string>();
  userToDelete: User | null = null;
  deletingUser = false;

  private searchTimeout?: number;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.loading = true;
    this.error = null;

    const request$ = this.searchQuery.trim()
      ? this.adminService.searchUsers(this.searchQuery.trim(), page, 10)
      : this.adminService.getAllUsers(page, 10);

    request$.subscribe({
      next: (response) => {
        this.users = response.users;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load users';
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.loadUsers(1);
    }, 500);
  }

  goToPage(page: number): void {
    if (page >= 1 && this.pagination && page <= this.pagination.totalPages) {
      this.loadUsers(page);
    }
  }

  updateUserRole(user: User, event: any): void {
    const newRole = event.target.value as UserRole;
    if (newRole === user.role) return;

    this.updatingUsers.add(user._id);

    this.adminService.updateUserRole(user._id, newRole).subscribe({
      next: (response) => {
        user.role = response.user.role;
        this.updatingUsers.delete(user._id);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update user role';
        event.target.value = user.role; // Reset select value
        this.updatingUsers.delete(user._id);
      },
    });
  }

  toggleUserStatus(user: User): void {
    this.updatingUsers.add(user._id);

    this.adminService.toggleUserStatus(user._id, !user.isActive).subscribe({
      next: (response) => {
        user.isActive = response.user.isActive;
        this.updatingUsers.delete(user._id);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update user status';
        this.updatingUsers.delete(user._id);
      },
    });
  }

  confirmDeleteUser(user: User): void {
    this.userToDelete = user;
  }

  cancelDelete(): void {
    this.userToDelete = null;
    this.deletingUser = false;
  }

  deleteUser(user: User): void {
    this.deletingUser = true;

    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u._id !== user._id);
        this.cancelDelete();
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to delete user';
        this.deletingUser = false;
      },
    });
  }
}
