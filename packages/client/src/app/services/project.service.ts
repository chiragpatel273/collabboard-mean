import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddMemberRequest,
  CreateProjectRequest,
  Project,
  ProjectsResponse,
  UpdateProjectRequest,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:5000/api/projects';

  constructor(private http: HttpClient) {}

  createProject(data: CreateProjectRequest): Observable<{ message: string; project: Project }> {
    return this.http.post<{ message: string; project: Project }>(this.apiUrl, data);
  }

  getUserProjects(page: number = 1, limit: number = 10): Observable<ProjectsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ProjectsResponse>(this.apiUrl, { params });
  }

  getProjectById(projectId: string): Observable<{ message: string; project: Project }> {
    return this.http.get<{ message: string; project: Project }>(`${this.apiUrl}/${projectId}`);
  }

  updateProject(
    projectId: string,
    data: UpdateProjectRequest
  ): Observable<{ message: string; project: Project }> {
    return this.http.put<{ message: string; project: Project }>(
      `${this.apiUrl}/${projectId}`,
      data
    );
  }

  deleteProject(projectId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${projectId}`);
  }

  addMemberToProject(
    projectId: string,
    data: AddMemberRequest
  ): Observable<{ message: string; project: Project }> {
    return this.http.post<{ message: string; project: Project }>(
      `${this.apiUrl}/${projectId}/members`,
      data
    );
  }

  removeMemberFromProject(
    projectId: string,
    memberId: string
  ): Observable<{ message: string; project: Project }> {
    return this.http.delete<{ message: string; project: Project }>(
      `${this.apiUrl}/${projectId}/members/${memberId}`
    );
  }

  searchProjects(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ProjectsResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProjectsResponse>(`${this.apiUrl}/search`, { params });
  }
}
