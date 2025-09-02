import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema
} from "../schemas/project.schemas";
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  getUserAssignedTasks,
  deleteTask,
  searchTasks
} from "../controllers/task.controller";

const router = Router();

// All task routes require authentication
router.use(authMiddleware);
router.use(requireUser);

// Task management routes
router.get("/my", getUserAssignedTasks); // Must come before /:taskId
router.get("/search", searchTasks);

// Project-specific task routes
router.post("/projects/:projectId/tasks", validate(createTaskSchema), createTask);
router.get("/projects/:projectId/tasks", getTasksByProject);

// Individual task routes
router.get("/:taskId", getTaskById);
router.put("/:taskId", validate(updateTaskSchema), updateTask);
router.put("/:taskId/status", validate(updateTaskStatusSchema), updateTaskStatus);
router.put("/:taskId/assign", validate(assignTaskSchema), assignTask);
router.delete("/:taskId", deleteTask);

export default router;
