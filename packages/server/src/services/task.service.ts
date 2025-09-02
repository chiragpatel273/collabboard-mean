import { Task, ITask, TaskStatus, TaskPriority } from "../models/task.model";
import { Project } from "../models/project.model";
import { AppError } from "../middleware/error.middleware";
import mongoose from "mongoose";

// Create new task
export const createTask = async (
  title: string,
  description: string | undefined,
  projectId: string,
  createdById: string,
  priority: TaskPriority = TaskPriority.MEDIUM,
  dueDate?: Date,
  tags: string[] = []
): Promise<ITask> => {
  // Verify project exists and user has access
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  const hasAccess = project.ownerId.toString() === createdById || 
                   project.members.some(member => member.toString() === createdById);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this project", 403);
  }

  const task = new Task({
    title,
    description,
    status: TaskStatus.TODO,
    priority,
    projectId,
    createdBy: createdById,
    dueDate,
    tags
  });

  await task.save();
  
  return await Task.findById(task._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name") as ITask;
};

// Get tasks by project
export const getTasksByProject = async (
  projectId: string,
  userId: string,
  filters: {
    status?: TaskStatus;
    assignedTo?: string;
    priority?: TaskPriority;
    tags?: string[];
  } = {},
  page: number = 1,
  limit: number = 20
) => {
  // Verify user has access to project
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some(member => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this project", 403);
  }

  // Build query
  const query: any = { projectId };
  
  if (filters.status) query.status = filters.status;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.priority) query.priority = filters.priority;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(query);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasMore: skip + limit < total
    }
  };
};

// Get task by ID
export const getTaskById = async (taskId: string, userId: string): Promise<ITask> => {
  const task = await Task.findById(taskId)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name ownerId members");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify user has access to the project
  const project = task.projectId as any;
  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some((member: any) => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this task", 403);
  }

  return task;
};

// Update task
export const updateTask = async (
  taskId: string,
  userId: string,
  updateData: Partial<ITask>
): Promise<ITask> => {
  const task = await Task.findById(taskId).populate("projectId", "ownerId members");
  
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify user has access to the project
  const project = task.projectId as any;
  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some((member: any) => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this task", 403);
  }

  // Update allowed fields
  const allowedUpdates = ["title", "description", "priority", "dueDate", "tags"];
  const updates: any = {};
  
  allowedUpdates.forEach(field => {
    if (updateData[field as keyof ITask] !== undefined) {
      updates[field] = updateData[field as keyof ITask];
    }
  });

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    updates,
    { new: true, runValidators: true }
  )
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name");

  return updatedTask!;
};

// Update task status
export const updateTaskStatus = async (
  taskId: string,
  userId: string,
  status: TaskStatus
): Promise<ITask> => {
  const task = await Task.findById(taskId).populate("projectId", "ownerId members");
  
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify user has access to the project
  const project = task.projectId as any;
  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some((member: any) => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this task", 403);
  }

  task.status = status;
  await task.save();

  return await Task.findById(taskId)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name") as ITask;
};

// Assign task
export const assignTask = async (
  taskId: string,
  userId: string,
  assignToUserId?: string
): Promise<ITask> => {
  const task = await Task.findById(taskId).populate("projectId", "ownerId members");
  
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Verify user has access to the project
  const project = task.projectId as any;
  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some((member: any) => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this task", 403);
  }

  // If assignToUserId is provided, verify they are a member of the project
  if (assignToUserId) {
    const isMember = project.ownerId.toString() === assignToUserId || 
                    project.members.some((member: any) => member.toString() === assignToUserId);
    
    if (!isMember) {
      throw new AppError("Cannot assign task to non-project member", 400);
    }

    task.assignedTo = assignToUserId as any;
  } else {
    // Unassign task
    task.assignedTo = undefined;
  }

  await task.save();

  return await Task.findById(taskId)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name") as ITask;
};

// Get user's assigned tasks
export const getUserAssignedTasks = async (
  userId: string,
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
  } = {},
  page: number = 1,
  limit: number = 20
) => {
  const query: any = { assignedTo: userId };
  
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.projectId) query.projectId = filters.projectId;

  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name")
    .sort({ dueDate: 1, createdAt: -1 }) // Due date first, then created date
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(query);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasMore: skip + limit < total
    }
  };
};

// Delete task
export const deleteTask = async (taskId: string, userId: string): Promise<{ message: string }> => {
  const task = await Task.findById(taskId).populate("projectId", "ownerId members");
  
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Only project members can delete tasks
  const project = task.projectId as any;
  const hasAccess = project.ownerId.toString() === userId || 
                   project.members.some((member: any) => member.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this task", 403);
  }

  await Task.findByIdAndDelete(taskId);

  return { message: "Task deleted successfully" };
};

// Search tasks
export const searchTasks = async (
  userId: string,
  query: string,
  projectId?: string,
  page: number = 1,
  limit: number = 20
) => {
  // Build search query
  const searchQuery: any = {
    $text: { $search: query }
  };

  if (projectId) {
    // If specific project, verify access first
    const project = await Project.findById(projectId);
    if (!project || !project.isActive) {
      throw new AppError("Project not found", 404);
    }

    const hasAccess = project.ownerId.toString() === userId || 
                     project.members.some(member => member.toString() === userId);
    
    if (!hasAccess) {
      throw new AppError("Access denied to this project", 403);
    }

    searchQuery.projectId = projectId;
  } else {
    // Search across all user's projects
    const userProjects = await Project.find({
      $and: [
        { isActive: true },
        { $or: [{ ownerId: userId }, { members: userId }] }
      ]
    }).select("_id");

    const projectIds = userProjects.map(p => p._id);
    searchQuery.projectId = { $in: projectIds };
  }

  const skip = (page - 1) * limit;

  const tasks = await Task.find(searchQuery)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("projectId", "name")
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(searchQuery);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasMore: skip + limit < total
    },
    query
  };
};
