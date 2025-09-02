import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminService, UserStats } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p class="subtitle">System overview and management</p>
      </div>

      <div class="stats-grid" *ngIf="userStats">
        <div class="stat-card primary">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.totalUsers }}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.activeUsers }}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">
            <i class="fas fa-user-shield"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.adminUsers }}</h3>
            <p>Admin Users</p>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.recentSignups }}</h3>
            <p>Recent Signups</p>
          </div>
        </div>

        <div class="stat-card danger" *ngIf="userStats.inactiveUsers > 0">
          <div class="stat-icon">
            <i class="fas fa-user-times"></i>
          </div>
          <div class="stat-content">
            <h3>{{ userStats.inactiveUsers }}</h3>
            <p>Inactive Users</p>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-grid">
          <div class="action-card" routerLink="/admin/users">
            <div class="action-icon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div class="action-content">
              <h3>Manage Users</h3>
              <p>View, edit, and manage user accounts</p>
            </div>
          </div>

          <div class="action-card" (click)="refreshStats()">
            <div class="action-icon">
              <i class="fas fa-sync-alt"></i>
            </div>
            <div class="action-content">
              <h3>Refresh Statistics</h3>
              <p>Update system statistics and metrics</p>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading admin data...</p>
        </div>
      </div>

      <div class="error-message" *ngIf="error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadStats()"><i class="fas fa-redo"></i> Retry</button>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-dashboard {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 2rem;
        text-align: center;
      }

      .dashboard-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: #666;
        font-size: 1.1rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .stat-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 1.5rem;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .stat-card.primary .stat-icon {
        background: #6366f1;
      }
      .stat-card.success .stat-icon {
        background: #10b981;
      }
      .stat-card.warning .stat-icon {
        background: #f59e0b;
      }
      .stat-card.info .stat-icon {
        background: #3b82f6;
      }
      .stat-card.danger .stat-icon {
        background: #ef4444;
      }

      .stat-content h3 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 0.25rem 0;
      }

      .stat-content p {
        color: #666;
        margin: 0;
        font-size: 0.9rem;
      }

      .quick-actions {
        margin-bottom: 2rem;
      }

      .quick-actions h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 1rem;
      }

      .action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .action-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 1.5rem;
        cursor: pointer;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .action-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }

      .action-icon {
        width: 50px;
        height: 50px;
        background: #f3f4f6;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: #6366f1;
      }

      .action-content h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 0.25rem 0;
      }

      .action-content p {
        color: #666;
        margin: 0;
        font-size: 0.9rem;
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .loading-spinner {
        text-align: center;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      .loading-spinner p {
        color: #666;
        font-size: 0.9rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-message {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
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
        transition: background-color 0.2s ease;
      }

      .retry-btn:hover {
        background: #b91c1c;
      }

      @media (max-width: 768px) {
        .admin-dashboard {
          padding: 1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .action-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-header h1 {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  userStats: UserStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getUserStats().subscribe({
      next: (response) => {
        this.userStats = response.stats;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load statistics';
        this.loading = false;
      },
    });
  }

  refreshStats(): void {
    this.loadStats();
  }
}
