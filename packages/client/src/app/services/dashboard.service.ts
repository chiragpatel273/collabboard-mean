import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardData {
  assignedTasks: any[];
  overdueTasks: any[];
  dueSoonTasks: any[];
  completedThisWeek: any[];
  totalAssigned: number;
}

export interface ProjectStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentUsers: number;
}

export interface ProjectOverview {
  totalProjects: number;
  activeProjects: number;
  deletedProjects: number;
  recentProjects: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getUserDashboard(): Observable<{ message: string; dashboard: DashboardData }> {
    return this.http.get<{ message: string; dashboard: DashboardData }>(
      `${this.apiUrl}/tasks/dashboard`
    );
  }

  getProjectStats(projectId: string): Observable<{ message: string; stats: ProjectStats }> {
    return this.http.get<{ message: string; stats: ProjectStats }>(
      `${this.apiUrl}/projects/${projectId}/stats`
    );
  }

  getUserStats(): Observable<{ message: string; stats: UserStats }> {
    return this.http.get<{ message: string; stats: UserStats }>(`${this.apiUrl}/admin/users/stats`);
  }

  getProjectOverview(): Observable<{ message: string; stats: ProjectOverview }> {
    return this.http.get<{ message: string; stats: ProjectOverview }>(
      `${this.apiUrl}/projects/stats`
    );
  }
}
