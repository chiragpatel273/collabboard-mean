import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';
import { TaskPriority, TaskStatus } from '../../../models/task.model';
import { AuthService } from '../../../services/auth.service';
import {
  DashboardData,
  DashboardService,
  ProjectOverview,
} from '../../../services/dashboard.service';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  dashboardData: DashboardData | null = null;
  recentProjects: Project[] = [];
  projectOverview: ProjectOverview | null = null;
  currentUser: any = null;

  // Expose enums to template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  constructor(
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadDashboardData();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    // Load dashboard data, recent projects, and project overview in parallel
    Promise.all([
      this.loadUserDashboard(),
      this.loadRecentProjects(),
      this.loadProjectOverview(),
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadUserDashboard(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getUserDashboard().subscribe({
        next: (response) => {
          console.log('Dashboard data received:', response);
          this.dashboardData = response.dashboard;
          resolve();
        },
        error: (error) => {
          console.error('Failed to load dashboard data:', error);
          resolve();
        },
      });
    });
  }

  private loadRecentProjects(): Promise<void> {
    return new Promise((resolve) => {
      this.projectService.getUserProjects(1, 5).subscribe({
        next: (response) => {
          console.log('Recent projects received:', response);
          this.recentProjects = response.documents;
          resolve();
        },
        error: (error) => {
          console.error('Failed to load recent projects:', error);
          resolve();
        },
      });
    });
  }

  private loadProjectOverview(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getProjectOverview().subscribe({
        next: (response) => {
          this.projectOverview = response.stats;
          resolve();
        },
        error: (error) => {
          console.error('Failed to load project overview:', error);
          resolve();
        },
      });
    });
  }

  // Check if dashboard is empty (no meaningful data to show)
  isEmpty(): boolean {
    const hasProjects = this.recentProjects && this.recentProjects.length > 0;
    const hasTasks =
      this.dashboardData &&
      (this.dashboardData.totalAssigned > 0 ||
        this.dashboardData.assignedTasks.length > 0 ||
        this.dashboardData.completedThisWeek.length > 0);

    return !hasProjects && !hasTasks;
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.LOW:
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  }

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'status-todo';
      case TaskStatus.IN_PROGRESS:
        return 'status-in-progress';
      case TaskStatus.DONE:
        return 'status-done';
      default:
        return 'status-todo';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  isTaskOverdue(task: any): boolean {
    return task.dueDate && new Date(task.dueDate) < new Date();
  }

  getCompletionPercentage(): number {
    if (!this.dashboardData || this.dashboardData.totalAssigned === 0) return 0;
    const completed = this.dashboardData.completedThisWeek.length;
    return Math.round((completed / this.dashboardData.totalAssigned) * 100);
  }
}
