import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '../../../models/project.model';
import { CreateTaskRequest } from '../../../models/task.model';
import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { CreateTaskComponent } from '../../tasks/create-task/create-task.component';
import { TaskBoardComponent } from '../../tasks/task-board/task-board.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, TaskBoardComponent, CreateTaskComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
})
export class ProjectDetailComponent implements OnInit {
  @ViewChild(TaskBoardComponent) taskBoard!: TaskBoardComponent;
  @ViewChild(CreateTaskComponent) createTaskComponent!: CreateTaskComponent;

  project: Project | null = null;
  isLoading = false;
  errorMessage = '';
  showCreateTask = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const projectId = params['id'];
      if (projectId) {
        this.loadProject(projectId);
      }
    });
  }

  loadProject(projectId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjectById(projectId).subscribe({
      next: (response: any) => {
        this.project = response.project;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Failed to load project';
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  openCreateTaskModal(): void {
    this.showCreateTask = true;
  }

  closeCreateTaskModal(): void {
    this.showCreateTask = false;
  }

  onTaskCreated(taskData: CreateTaskRequest): void {
    if (this.project) {
      this.taskService.createTask(this.project._id, taskData).subscribe({
        next: () => {
          this.closeCreateTaskModal();
          // Reset the create task form
          if (this.createTaskComponent) {
            this.createTaskComponent.resetForm();
          }
          // Refresh the task board to show the new task
          if (this.taskBoard) {
            this.taskBoard.refreshTasks();
          }
        },
        error: (error: any) => {
          console.error('Failed to create task:', error);
        },
      });
    }
  }
}
