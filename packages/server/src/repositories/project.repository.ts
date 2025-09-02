import { BaseRepository } from './base.repository';
import { IProject, Project } from '../models/project.model';
import { FilterQuery } from 'mongoose';

export class ProjectRepository extends BaseRepository<IProject> {
  constructor() {
    super(Project);
  }

  async findByOwner(ownerId: string): Promise<IProject[]> {
    return await this.find({ ownerId: ownerId, isDeleted: false }, {
      populate: ['ownerId', 'members'],
      sort: { updatedAt: -1 }
    });
  }

  async findByMember(userId: string): Promise<IProject[]> {
    return await this.find({
      $or: [
        { ownerId: userId },
        { members: userId }
      ],
      isDeleted: false
    }, {
      populate: ['ownerId', 'members'],
      sort: { updatedAt: -1 }
    });
  }

  async findActiveProjects(filter: FilterQuery<IProject> = {}): Promise<IProject[]> {
    return await this.find({ ...filter, isDeleted: false }, {
      populate: ['ownerId', 'members'],
      sort: { updatedAt: -1 }
    });
  }

  async findProjectsWithPagination(
    filter: FilterQuery<IProject> = {},
    page: number = 1,
    limit: number = 10,
    options: {
      userId?: string;
      includeDeleted?: boolean;
    } = {}
  ) {
    const searchFilter: FilterQuery<IProject> = { ...filter };
    
    // Filter by user access if provided
    if (options.userId) {
      searchFilter.$or = [
        { ownerId: options.userId },
        { members: options.userId }
      ];
    }
    
    // Exclude deleted projects unless explicitly requested
    if (!options.includeDeleted) {
      searchFilter.isDeleted = false;
    }

    return await this.findWithPagination(searchFilter, page, limit, {
      populate: ['ownerId', 'members'],
      sort: { updatedAt: -1 }
    });
  }

  async searchProjects(
    searchTerm: string,
    userId?: string,
    options: {
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IProject[]> {
    const filter: FilterQuery<IProject> = { isDeleted: false };
    
    // Filter by user access if provided
    if (userId) {
      filter.$or = [
        { ownerId: userId },
        { members: userId }
      ];
    }

    return await this.textSearch(searchTerm, filter, {
      populate: ['ownerId', 'members'],
      limit: options.limit,
      skip: options.skip
    });
  }

  async addMember(projectId: string, userId: string): Promise<IProject | null> {
    return await this.findByIdAndUpdate(projectId, {
      $addToSet: { members: userId }
    }, { populate: ['ownerId', 'members'] });
  }

  async removeMember(projectId: string, userId: string): Promise<IProject | null> {
    return await this.findByIdAndUpdate(projectId, {
      $pull: { members: userId }
    }, { populate: ['ownerId', 'members'] });
  }

  async softDelete(projectId: string): Promise<IProject | null> {
    return await this.findByIdAndUpdate(projectId, {
      isDeleted: true,
      deletedAt: new Date()
    });
  }

  async restore(projectId: string): Promise<IProject | null> {
    return await this.findByIdAndUpdate(projectId, {
      isDeleted: false,
      $unset: { deletedAt: 1 }
    });
  }

  async findUserProjects(userId: string, includeDeleted: boolean = false): Promise<IProject[]> {
    const filter: FilterQuery<IProject> = {
      $or: [
        { ownerId: userId },
        { members: userId }
      ]
    };
    
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    return await this.find(filter, {
      populate: ['ownerId', 'members'],
      sort: { updatedAt: -1 }
    });
  }

  async isUserMemberOrOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await this.findOne({
      _id: projectId,
      $or: [
        { ownerId: userId },
        { members: userId }
      ],
      isDeleted: false
    });
    
    return project !== null;
  }

  async getProjectOwner(projectId: string): Promise<string | null> {
    const project = await this.findById(projectId, 'ownerId');
    return project ? project.ownerId.toString() : null;
  }

  async updateLastActivity(projectId: string): Promise<IProject | null> {
    return await this.findByIdAndUpdate(projectId, {
      updatedAt: new Date()
    });
  }

  async getProjectStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    deletedProjects: number;
    recentProjects: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalProjects, activeProjects, deletedProjects, recentProjects] = await Promise.all([
      this.countDocuments(),
      this.countDocuments({ isDeleted: false }),
      this.countDocuments({ isDeleted: true }),
      this.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    return {
      totalProjects,
      activeProjects,
      deletedProjects,
      recentProjects
    };
  }
}
