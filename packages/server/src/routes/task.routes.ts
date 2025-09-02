import { Router } from 'express';
import {
  assignTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasksByProject,
  getUserAssignedTasks,
  getUserDashboard,
  searchTasks,
  updateTask,
  updateTaskStatus,
} from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireUser } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/project.schemas';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);
router.use(requireUser);

// Task management routes
router.get('/dashboard', getUserDashboard);
router.get('/my', getUserAssignedTasks); // Must come before /:taskId
router.get('/search', searchTasks);

// Project-specific task routes
router.post('/projects/:projectId/tasks', validate(createTaskSchema), createTask);
router.get('/projects/:projectId/tasks', getTasksByProject);

// Individual task routes
router.get('/:taskId', getTaskById);
router.put('/:taskId', validate(updateTaskSchema), updateTask);
router.put('/:taskId/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.put('/:taskId/assign', validate(assignTaskSchema), assignTask);
router.delete('/:taskId', deleteTask);

export default router;
