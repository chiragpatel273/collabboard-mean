export interface ApiResponse<T = any> {
  message: string;
  success?: boolean;
  data?: T;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: string[];
  statusCode?: number;
}
