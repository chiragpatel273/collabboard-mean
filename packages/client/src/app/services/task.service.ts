import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssignTaskRequest,
  CreateTaskRequest,
  Task,
  TaskFilters,
  TasksResponse,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
} from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:5000/api/tasks';

  constructor(private http: HttpClient) {}

  createTask(
    projectId: string,
    data: CreateTaskRequest
  ): Observable<{ message: string; task: Task }> {
    return this.http.post<{ message: string; task: Task }>(
      `${this.apiUrl}/projects/${projectId}/tasks`,
      data
    );
  }

  getTasksByProject(
    projectId: string,
    filters: TaskFilters = {},
    page: number = 1,
    limit: number = 20
  ): Observable<TasksResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filters.status) params = params.set('status', filters.status);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.tags?.length) {
      filters.tags.forEach((tag) => (params = params.append('tags', tag)));
    }

    return this.http.get<TasksResponse>(`${this.apiUrl}/projects/${projectId}/tasks`, { params });
  }

  getTaskById(taskId: string): Observable<{ message: string; task: Task }> {
    return this.http.get<{ message: string; task: Task }>(`${this.apiUrl}/${taskId}`);
  }

  updateTask(taskId: string, data: UpdateTaskRequest): Observable<{ message: string; task: Task }> {
    return this.http.put<{ message: string; task: Task }>(`${this.apiUrl}/${taskId}`, data);
  }

  updateTaskStatus(
    taskId: string,
    data: UpdateTaskStatusRequest
  ): Observable<{ message: string; task: Task }> {
    return this.http.put<{ message: string; task: Task }>(`${this.apiUrl}/${taskId}/status`, data);
  }

  assignTask(taskId: string, data: AssignTaskRequest): Observable<{ message: string; task: Task }> {
    return this.http.put<{ message: string; task: Task }>(`${this.apiUrl}/${taskId}/assign`, data);
  }

  deleteTask(taskId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${taskId}`);
  }

  getUserAssignedTasks(page: number = 1, limit: number = 20): Observable<TasksResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<TasksResponse>(`${this.apiUrl}/my`, { params });
  }

  searchTasks(
    query: string,
    projectId?: string,
    page: number = 1,
    limit: number = 20
  ): Observable<TasksResponse> {
    let params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (projectId) params = params.set('projectId', projectId);

    return this.http.get<TasksResponse>(`${this.apiUrl}/search`, { params });
  }
}
