// Export refactored services
export { AuthService, authService } from './auth.service';
export { AdminService, adminService } from './admin.service';
export { ProjectService, projectService } from './project.service';
export { TaskService, taskService } from './task.service';
export { cleanupService } from './cleanup.service';

// Re-export for backward compatibility
export * from './auth.service';
export * from './project.service';
export * from './task.service';
