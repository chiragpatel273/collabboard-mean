import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  totalPages = 0;
  hasNextPage = false;
  hasPreviousPage = false;

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getUserProjects(page, 12).subscribe({
      next: (response) => {
        console.log('Projects response:', response);
        this.projects = response.documents;
        this.currentPage = response.pagination.currentPage;
        this.totalPages = response.pagination.totalPages;
        this.hasNextPage = response.pagination.hasMore;
        this.hasPreviousPage = response.pagination.currentPage > 1;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.errorMessage = error.error?.message || 'Failed to load projects';
        this.isLoading = false;
      },
    });
  }

  onProjectClick(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  onCreateProject(): void {
    this.router.navigate(['/projects/new']);
  }

  onPreviousPage(): void {
    if (this.hasPreviousPage) {
      this.loadProjects(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.hasNextPage) {
      this.loadProjects(this.currentPage + 1);
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }
}
