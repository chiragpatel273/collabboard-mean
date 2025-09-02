import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Task, TaskStatus } from '../../../models/task.model';
import { TaskService } from '../../../services/task.service';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, TaskCardComponent],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.css',
})
export class TaskBoardComponent implements OnInit {
  @Input() projectId!: string;

  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.loadTasks();
    }
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (response) => {
        console.log('Tasks response:', response);
        this.tasks = response.documents;
        this.organizeTasks();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.errorMessage = error.error?.message || 'Failed to load tasks';
        this.isLoading = false;
      },
    });
  }

  organizeTasks(): void {
    this.todoTasks = this.tasks.filter((task) => task.status === TaskStatus.TODO);
    this.inProgressTasks = this.tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
    this.doneTasks = this.tasks.filter((task) => task.status === TaskStatus.DONE);
  }

  onTaskStatusChanged(taskId: string, newStatus: TaskStatus): void {
    this.taskService.updateTaskStatus(taskId, { status: newStatus }).subscribe({
      next: () => {
        this.loadTasks(); // Reload tasks to reflect changes
      },
      error: (error) => {
        console.error('Failed to update task status:', error);
      },
    });
  }

  onTaskDeleted(taskId: string): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.loadTasks(); // Reload tasks to reflect changes
      },
      error: (error) => {
        console.error('Failed to delete task:', error);
      },
    });
  }

  refreshTasks(): void {
    this.loadTasks();
  }

  onDropTask(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    if (taskId) {
      this.onTaskStatusChanged(taskId, status);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  get TaskStatus() {
    return TaskStatus;
  }
}
