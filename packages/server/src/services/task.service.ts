import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import { ITask, TaskPriority, TaskStatus } from '../models/task.model';
import { ProjectRepository, TaskRepository } from '../repositories';

export class TaskService {
  private taskRepository: TaskRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.projectRepository = new ProjectRepository();
  }

  // Create new task
  async createTask(
    title: string,
    description: string | undefined,
    projectId: string,
    createdById: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    dueDate?: Date,
    tags: string[] = []
  ): Promise<ITask> {
    // Verify project exists and user has access
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, createdById);
    if (!hasAccess) {
      throw new AppError('Access denied to this project', 403);
    }

    const createdByObjectId = new mongoose.Types.ObjectId(createdById);
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const task = await this.taskRepository.create({
      title,
      description,
      status: TaskStatus.TODO,
      priority,
      projectId: projectObjectId,
      createdBy: createdByObjectId,
      dueDate,
      tags,
    });

    return (await this.taskRepository.findById(task._id as string, [
      'createdBy',
      'assignedTo',
      'projectId',
    ])) as ITask;
  }

  // Get tasks by project
  async getTasksByProject(
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
  ) {
    // Verify user has access to project
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
    if (!hasAccess) {
      throw new AppError('Access denied to this project', 403);
    }

    return await this.taskRepository.findTasksWithPagination({}, page, limit, {
      projectId,
      assignedTo: filters.assignedTo,
      status: filters.status,
      priority: filters.priority,
    });
  }

  // Get task by ID
  async getTaskById(taskId: string, userId: string): Promise<ITask> {
    const task = await this.taskRepository.findById(taskId, [
      'createdBy',
      'assignedTo',
      'projectId',
    ]);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Extract project ID, handling both ObjectId and populated Project cases
    const projectId =
      typeof task.projectId === 'string'
        ? task.projectId
        : task.projectId._id?.toString() || task.projectId.toString();

    // Verify user has access to the project this task belongs to
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
    if (!hasAccess) {
      throw new AppError('Access denied to this task', 403);
    }

    return task;
  }

  // Update task
  async updateTask(
    taskId: string,
    userId: string,
    updateData: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: Date | null;
      tags?: string[];
    }
  ): Promise<ITask> {
    const task = await this.getTaskById(taskId, userId);

    const updates: any = {};
    const allowedUpdates = ['title', 'description', 'priority', 'dueDate', 'tags'];

    allowedUpdates.forEach((field) => {
      if (updateData[field as keyof typeof updateData] !== undefined) {
        updates[field] = updateData[field as keyof typeof updateData];
      }
    });

    return (await this.taskRepository.findByIdAndUpdate(taskId, updates, {
      populate: ['createdBy', 'assignedTo', 'projectId'],
    })) as ITask;
  }

  // Update task status
  async updateTaskStatus(taskId: string, userId: string, status: TaskStatus): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.updateStatus(taskId, status)) as ITask;
  }

  // Assign task
  async assignTask(taskId: string, userId: string, assigneeId: string): Promise<ITask> {
    const task = await this.getTaskById(taskId, userId);

    // Extract project ID, handling both ObjectId and populated Project cases
    const projectId =
      typeof task.projectId === 'string'
        ? task.projectId
        : task.projectId._id?.toString() || task.projectId.toString();

    // Verify assignee has access to the project
    const assigneeHasAccess = await this.projectRepository.isUserMemberOrOwner(
      projectId,
      assigneeId
    );
    if (!assigneeHasAccess) {
      throw new AppError('Assignee does not have access to this project', 400);
    }

    return (await this.taskRepository.assignTask(taskId, assigneeId)) as ITask;
  }

  // Unassign task
  async unassignTask(taskId: string, userId: string): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.unassignTask(taskId)) as ITask;
  }

  // Delete task
  async deleteTask(taskId: string, userId: string): Promise<{ message: string }> {
    await this.getTaskById(taskId, userId); // Verify access
    await this.taskRepository.findByIdAndDelete(taskId);
    return { message: 'Task deleted successfully' };
  }

  // Get user's assigned tasks
  async getUserTasks(userId: string, page: number = 1, limit: number = 20) {
    return await this.taskRepository.findTasksWithPagination({}, page, limit, {
      assignedTo: userId,
    });
  }

  // Get user dashboard
  async getUserDashboard(userId: string) {
    return await this.taskRepository.getUserDashboard(userId);
  }

  // Search tasks
  async searchTasks(
    searchTerm: string,
    userId: string,
    filters: {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const options = {
      projectId: filters.projectId,
      limit,
      skip: (page - 1) * limit,
    };

    const tasks = await this.taskRepository.searchTasks(searchTerm, options);

    // Filter tasks by user access (this could be optimized)
    const accessibleTasks = [];
    for (const task of tasks) {
      // Extract project ID, handling both ObjectId and populated Project cases
      const projectId =
        typeof task.projectId === 'string'
          ? task.projectId
          : task.projectId._id?.toString() || task.projectId.toString();

      const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
      if (hasAccess) {
        accessibleTasks.push(task);
      }
    }

    return {
      tasks: accessibleTasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(accessibleTasks.length / limit),
        totalTasks: accessibleTasks.length,
        hasMore: accessibleTasks.length === limit,
      },
      searchTerm,
    };
  }

  // Get tasks by status
  async getTasksByStatus(status: TaskStatus, projectId?: string) {
    return await this.taskRepository.findByStatus(status, projectId);
  }

  // Get tasks by priority
  async getTasksByPriority(priority: TaskPriority, projectId?: string) {
    return await this.taskRepository.findByPriority(priority, projectId);
  }

  // Get overdue tasks
  async getOverdueTasks() {
    return await this.taskRepository.findOverdueTasks();
  }

  // Get tasks due soon
  async getTasksDueSoon(days: number = 7) {
    return await this.taskRepository.findDueSoonTasks(days);
  }

  // Update task priority
  async updateTaskPriority(taskId: string, userId: string, priority: TaskPriority): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.updatePriority(taskId, priority)) as ITask;
  }

  // Update task due date
  async updateTaskDueDate(taskId: string, userId: string, dueDate: Date | null): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.updateDueDate(taskId, dueDate)) as ITask;
  }

  // Add tag to task
  async addTaskTag(taskId: string, userId: string, tag: string): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.addTag(taskId, tag)) as ITask;
  }

  // Remove tag from task
  async removeTaskTag(taskId: string, userId: string, tag: string): Promise<ITask> {
    await this.getTaskById(taskId, userId); // Verify access
    return (await this.taskRepository.removeTag(taskId, tag)) as ITask;
  }

  // Get tasks by tags
  async getTasksByTags(tags: string[], projectId?: string) {
    return await this.taskRepository.findByTags(tags, projectId);
  }

  // Get project task statistics
  async getProjectTaskStats(projectId: string, userId: string) {
    // Verify user has access to project
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
    if (!hasAccess) {
      throw new AppError('Access denied to this project', 403);
    }

    return await this.taskRepository.getProjectTaskStats(projectId);
  }

  // Get task completion stats
  async getTaskCompletion(projectId: string, userId: string, period: 'week' | 'month' = 'week') {
    // Verify user has access to project
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
    if (!hasAccess) {
      throw new AppError('Access denied to this project', 403);
    }

    return await this.taskRepository.getTaskCompletion(projectId, period);
  }
}

// Export singleton instance for backward compatibility
export const taskService = new TaskService();

// Export individual functions for backward compatibility (you'll need to implement these)
export const createTask = taskService.createTask.bind(taskService);
export const getTasksByProject = taskService.getTasksByProject.bind(taskService);
export const getTaskById = taskService.getTaskById.bind(taskService);
export const updateTask = taskService.updateTask.bind(taskService);
export const updateTaskStatus = taskService.updateTaskStatus.bind(taskService);
export const assignTask = taskService.assignTask.bind(taskService);
export const unassignTask = taskService.unassignTask.bind(taskService);
export const deleteTask = taskService.deleteTask.bind(taskService);
