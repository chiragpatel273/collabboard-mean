import { BaseRepository } from './base.repository';
import { ITask, Task, TaskStatus, TaskPriority } from '../models/task.model';
import { FilterQuery } from 'mongoose';

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  async findByProject(projectId: string): Promise<ITask[]> {
    return await this.find(
      { projectId },
      {
        populate: ['assignedTo', 'createdBy'],
        sort: { createdAt: -1 },
      }
    );
  }

  async findByAssignee(userId: string): Promise<ITask[]> {
    return await this.find(
      { assignedTo: userId },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
        sort: { dueDate: 1, priority: -1 },
      }
    );
  }

  async findByCreator(userId: string): Promise<ITask[]> {
    return await this.find(
      { createdBy: userId },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
        sort: { createdAt: -1 },
      }
    );
  }

  async findByStatus(status: TaskStatus, projectId?: string): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = { status };
    if (projectId) {
      filter.projectId = projectId;
    }

    return await this.find(filter, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
      sort: { updatedAt: -1 },
    });
  }

  async findByPriority(priority: TaskPriority, projectId?: string): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = { priority };
    if (projectId) {
      filter.projectId = projectId;
    }

    return await this.find(filter, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
      sort: { dueDate: 1 },
    });
  }

  async findTasksWithPagination(
    filter: FilterQuery<ITask> = {},
    page: number = 1,
    limit: number = 10,
    options: {
      projectId?: string;
      assignedTo?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueSoon?: boolean;
    } = {}
  ) {
    const searchFilter: FilterQuery<ITask> = { ...filter };

    if (options.projectId) searchFilter.projectId = options.projectId;
    if (options.assignedTo) searchFilter.assignedTo = options.assignedTo;
    if (options.status) searchFilter.status = options.status;
    if (options.priority) searchFilter.priority = options.priority;

    if (options.dueSoon) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      searchFilter.dueDate = { $lte: nextWeek };
    }

    return await this.findWithPagination(searchFilter, page, limit, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
      sort: { priority: -1, dueDate: 1, createdAt: -1 },
    });
  }

  async searchTasks(
    searchTerm: string,
    options: {
      projectId?: string;
      assignedTo?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = {};
    if (options.projectId) filter.projectId = options.projectId;
    if (options.assignedTo) filter.assignedTo = options.assignedTo;

    return await this.textSearch(searchTerm, filter, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
      limit: options.limit,
      skip: options.skip,
    });
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<ITask | null> {
    const updateData: any = { status };

    // Set completion date when task is marked as done
    if (status === TaskStatus.DONE) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    return await this.findByIdAndUpdate(taskId, updateData, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
    });
  }

  async assignTask(taskId: string, userId: string): Promise<ITask | null> {
    return await this.findByIdAndUpdate(
      taskId,
      { assignedTo: userId },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
      }
    );
  }

  async unassignTask(taskId: string): Promise<ITask | null> {
    return await this.findByIdAndUpdate(
      taskId,
      { $unset: { assignedTo: 1 } },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
      }
    );
  }

  async updatePriority(taskId: string, priority: TaskPriority): Promise<ITask | null> {
    return await this.findByIdAndUpdate(
      taskId,
      { priority },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
      }
    );
  }

  async updateDueDate(taskId: string, dueDate: Date | null): Promise<ITask | null> {
    const updateData = dueDate ? { dueDate } : { $unset: { dueDate: 1 } };
    return await this.findByIdAndUpdate(taskId, updateData, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
    });
  }

  async addTag(taskId: string, tag: string): Promise<ITask | null> {
    return await this.findByIdAndUpdate(
      taskId,
      {
        $addToSet: { tags: tag },
      },
      { populate: ['projectId', 'assignedTo', 'createdBy'] }
    );
  }

  async removeTag(taskId: string, tag: string): Promise<ITask | null> {
    return await this.findByIdAndUpdate(
      taskId,
      {
        $pull: { tags: tag },
      },
      { populate: ['projectId', 'assignedTo', 'createdBy'] }
    );
  }

  async findOverdueTasks(): Promise<ITask[]> {
    const now = new Date();
    return await this.find(
      {
        dueDate: { $lt: now },
        status: { $ne: TaskStatus.DONE },
      },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
        sort: { dueDate: 1 },
      }
    );
  }

  async findDueSoonTasks(days: number = 7): Promise<ITask[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.find(
      {
        dueDate: { $gte: now, $lte: futureDate },
        status: { $ne: TaskStatus.DONE },
      },
      {
        populate: ['projectId', 'assignedTo', 'createdBy'],
        sort: { dueDate: 1 },
      }
    );
  }

  async getUserDashboard(userId: string): Promise<{
    assignedTasks: ITask[];
    overdueTasks: ITask[];
    dueSoonTasks: ITask[];
    completedThisWeek: ITask[];
    totalAssigned: number;
  }> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [assignedTasks, overdueTasks, dueSoonTasks, completedThisWeek, totalAssigned] =
      await Promise.all([
        this.findByAssignee(userId),
        this.find(
          {
            assignedTo: userId,
            dueDate: { $lt: new Date() },
            status: { $ne: TaskStatus.DONE },
          },
          { populate: ['projectId'] }
        ),
        this.findDueSoonTasks(7).then((tasks) =>
          tasks.filter((task) => task.assignedTo?.toString() === userId)
        ),
        this.find(
          {
            assignedTo: userId,
            status: TaskStatus.DONE,
            completedAt: { $gte: startOfWeek },
          },
          { populate: ['projectId'] }
        ),
        this.countDocuments({ assignedTo: userId }),
      ]);

    return {
      assignedTasks,
      overdueTasks,
      dueSoonTasks,
      completedThisWeek,
      totalAssigned,
    };
  }

  async getProjectTaskStats(projectId: string): Promise<{
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
  }> {
    const now = new Date();

    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, highPriorityTasks] =
      await Promise.all([
        this.countDocuments({ projectId }),
        this.countDocuments({ projectId, status: TaskStatus.TODO }),
        this.countDocuments({ projectId, status: TaskStatus.IN_PROGRESS }),
        this.countDocuments({ projectId, status: TaskStatus.DONE }),
        this.countDocuments({
          projectId,
          dueDate: { $lt: now },
          status: { $ne: TaskStatus.DONE },
        }),
        this.countDocuments({ projectId, priority: TaskPriority.HIGH }),
      ]);

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      highPriorityTasks,
    };
  }

  async findByTags(tags: string[], projectId?: string): Promise<ITask[]> {
    const filter: FilterQuery<ITask> = { tags: { $in: tags } };
    if (projectId) {
      filter.projectId = projectId;
    }

    return await this.find(filter, {
      populate: ['projectId', 'assignedTo', 'createdBy'],
      sort: { createdAt: -1 },
    });
  }

  async getTaskCompletion(
    projectId: string,
    period: 'week' | 'month' = 'week'
  ): Promise<{
    completed: number;
    total: number;
    percentage: number;
  }> {
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const [completed, total] = await Promise.all([
      this.countDocuments({
        projectId,
        status: TaskStatus.DONE,
        completedAt: { $gte: startDate },
      }),
      this.countDocuments({
        projectId,
        createdAt: { $gte: startDate },
      }),
    ]);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}
