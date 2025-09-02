import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { projectService } from '../services/project.service';

// Create project
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const userId = (req as any).user.id;

  const project = await projectService.createProject(name, description, userId);

  res.status(201).json({
    message: 'Project created successfully',
    project,
  });
});

// Get user's projects
export const getUserProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await projectService.getUserProjects(userId, page, limit);

  res.json({
    message: 'Projects retrieved successfully',
    ...result,
  });
});

// Get project by ID
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;

  const project = await projectService.getProjectById(projectId, userId);

  res.json({
    message: 'Project retrieved successfully',
    project,
  });
});

// Update project
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;
  const updateData = req.body;

  const project = await projectService.updateProject(projectId, userId, updateData);

  res.json({
    message: 'Project updated successfully',
    project,
  });
});

// Add member to project
export const addMemberToProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { email } = req.body;
  const userId = (req as any).user.id;

  const project = await projectService.addMemberToProject(projectId, userId, email);

  res.json({
    message: 'Member added to project successfully',
    project,
  });
});

// Remove member from project
export const removeMemberFromProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, memberId } = req.params;
  const userId = (req as any).user.id;

  const project = await projectService.removeMemberFromProject(projectId, userId, memberId);

  res.json({
    message: 'Member removed from project successfully',
    project,
  });
});

// Delete project
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;

  const result = await projectService.deleteProject(projectId, userId);

  res.json(result);
});

// Search projects
export const searchProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const result = await projectService.searchProjects(userId, query, page, limit);

  res.json({
    message: 'Search completed successfully',
    ...result,
  });
});

// Get project statistics for a specific project
export const getProjectStats = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;

  // Verify user has access to the project
  await projectService.getProjectById(projectId, userId);

  const stats = await projectService.getProjectTaskStats(projectId, userId);

  res.json({
    message: 'Project statistics retrieved successfully',
    stats,
  });
});

// Get overall project overview/stats
export const getProjectOverview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const stats = await projectService.getUserProjectStats(userId);

  res.json({
    message: 'Project overview retrieved successfully',
    stats,
  });
});
