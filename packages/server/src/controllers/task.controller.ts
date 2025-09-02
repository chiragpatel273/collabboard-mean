import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { TaskStatus, TaskPriority } from "../models/task.model";
import * as taskService from "../services/task.service";

// Create task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, priority, dueDate, tags } = req.body;
  const userId = (req as any).user.id;

  const task = await taskService.createTask(
    title,
    description,
    projectId,
    userId,
    priority,
    dueDate ? new Date(dueDate) : undefined,
    tags
  );

  res.status(201).json({
    message: "Task created successfully",
    task
  });
});

// Get tasks by project
export const getTasksByProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Build filters from query params
  const filters: any = {};
  if (req.query.status) filters.status = req.query.status as TaskStatus;
  if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo as string;
  if (req.query.priority) filters.priority = req.query.priority as TaskPriority;
  if (req.query.tags) {
    filters.tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
  }

  const result = await taskService.getTasksByProject(projectId, userId, filters, page, limit);

  res.json({
    message: "Tasks retrieved successfully",
    ...result
  });
});

// Get task by ID
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = (req as any).user.id;

  const task = await taskService.getTaskById(taskId, userId);

  res.json({
    message: "Task retrieved successfully",
    task
  });
});

// Update task
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = (req as any).user.id;
  const updateData = req.body;

  // Convert dueDate string to Date if provided
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }

  const task = await taskService.updateTask(taskId, userId, updateData);

  res.json({
    message: "Task updated successfully",
    task
  });
});

// Update task status
export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const userId = (req as any).user.id;

  const task = await taskService.updateTaskStatus(taskId, userId, status);

  res.json({
    message: "Task status updated successfully",
    task
  });
});

// Assign task
export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { assignedTo } = req.body;
  const userId = (req as any).user.id;

  const task = await taskService.assignTask(taskId, userId, assignedTo);

  res.json({
    message: assignedTo ? "Task assigned successfully" : "Task unassigned successfully",
    task
  });
});

// Get user's assigned tasks
export const getUserAssignedTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Build filters from query params
  const filters: any = {};
  if (req.query.status) filters.status = req.query.status as TaskStatus;
  if (req.query.priority) filters.priority = req.query.priority as TaskPriority;
  if (req.query.projectId) filters.projectId = req.query.projectId as string;

  const result = await taskService.getUserAssignedTasks(userId, filters, page, limit);

  res.json({
    message: "Assigned tasks retrieved successfully",
    ...result
  });
});

// Delete task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = (req as any).user.id;

  const result = await taskService.deleteTask(taskId, userId);

  res.json(result);
});

// Search tasks
export const searchTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const query = req.query.q as string;
  const projectId = req.query.projectId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required"
    });
  }

  const result = await taskService.searchTasks(userId, query, projectId, page, limit);

  res.json({
    message: "Search completed successfully",
    ...result
  });
});
