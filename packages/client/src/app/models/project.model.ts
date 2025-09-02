export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface ProjectsResponse {
  message: string;
  documents: Project[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDocuments: number;
    hasMore: boolean;
  };
}
