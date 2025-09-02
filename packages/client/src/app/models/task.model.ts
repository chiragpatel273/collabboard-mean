export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  createdBy: string;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}

export interface AssignTaskRequest {
  assignedTo?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface TasksResponse {
  message: string;
  documents: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDocuments: number;
    hasMore: boolean;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  assignedTo?: string;
  priority?: TaskPriority;
  tags?: string[];
}
