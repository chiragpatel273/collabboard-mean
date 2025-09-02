import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateProjectRequest } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="create-project-container">
      <div class="header">
        <h2>Create New Project</h2>
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          <i class="fas fa-arrow-left"></i>
          Back to Projects
        </button>
      </div>

      <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="project-form">
        <div class="form-group">
          <label for="name">Project Name *</label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="form-control"
            [class.is-invalid]="
              projectForm.get('name')?.invalid && projectForm.get('name')?.touched
            "
            placeholder="Enter project name"
          />
          <div
            class="invalid-feedback"
            *ngIf="projectForm.get('name')?.invalid && projectForm.get('name')?.touched"
          >
            Project name is required
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-control"
            rows="4"
            placeholder="Enter project description"
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="onCancel()"
            [disabled]="isLoading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="projectForm.invalid || isLoading"
          >
            <i class="fas fa-spinner fa-spin" *ngIf="isLoading"></i>
            <i class="fas fa-plus" *ngIf="!isLoading"></i>
            {{ isLoading ? 'Creating...' : 'Create Project' }}
          </button>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .create-project-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .header h2 {
        margin: 0;
        color: #1a202c;
        font-weight: 600;
      }

      .project-form {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
        transition:
          border-color 0.15s ease-in-out,
          box-shadow 0.15s ease-in-out;
      }

      .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-control.is-invalid {
        border-color: #ef4444;
      }

      .invalid-feedback {
        display: block;
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      textarea.form-control {
        resize: vertical;
        min-height: 100px;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background-color: #3b82f6;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
      }

      .btn-secondary {
        background-color: #6b7280;
        color: white;
      }

      .btn-secondary:hover:not(:disabled) {
        background-color: #4b5563;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #ef4444;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        margin-top: 1rem;
        font-size: 0.875rem;
      }

      .fa-spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 768px) {
        .create-project-container {
          margin: 1rem;
          padding: 0;
        }

        .header {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .project-form {
          padding: 1.5rem;
        }

        .form-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class CreateProjectComponent implements OnInit {
  projectForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const projectData: CreateProjectRequest = {
        name: this.projectForm.value.name.trim(),
        description: this.projectForm.value.description?.trim() || '',
      };

      this.projectService.createProject(projectData).subscribe({
        next: (response) => {
          console.log('Project created successfully:', response);
          this.router.navigate(['/projects', response.project._id]);
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.errorMessage = error.error?.message || 'Failed to create project. Please try again.';
          this.isLoading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }
}
