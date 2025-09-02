import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateTaskRequest, TaskPriority } from '../../../models/task.model';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.css',
})
export class CreateTaskComponent {
  @Input() projectId!: string;
  @Output() taskCreated = new EventEmitter<CreateTaskRequest>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm: FormGroup;
  isSubmitting = false;

  priorities = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
  ];

  constructor(private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      priority: [TaskPriority.MEDIUM, Validators.required],
      dueDate: [''],
      tags: [''],
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.taskForm.value;
      const taskData: CreateTaskRequest = {
        title: formValue.title,
        description: formValue.description,
        priority: formValue.priority,
        dueDate: formValue.dueDate || undefined,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
      };

      this.taskCreated.emit(taskData);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  resetForm(): void {
    this.taskForm.reset({
      priority: TaskPriority.MEDIUM,
    });
    this.isSubmitting = false;
  }
}
