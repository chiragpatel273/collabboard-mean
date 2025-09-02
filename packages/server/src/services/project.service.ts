import { IProject } from '../models/project.model';
import { AppError } from '../middleware/error.middleware';
import { ProjectRepository, UserRepository } from '../repositories';
import mongoose from 'mongoose';

export class ProjectService {
  private projectRepository: ProjectRepository;
  private userRepository: UserRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.userRepository = new UserRepository();
  }

  // Create new project
  async createProject(
    name: string,
    description: string | undefined,
    ownerId: string
  ): Promise<IProject> {
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const project = await this.projectRepository.create({
      name,
      description,
      ownerId: ownerObjectId,
      members: [ownerObjectId], // Owner is automatically a member
      isActive: true,
      isDeleted: false,
    });

    // Return with populated fields
    return (await this.projectRepository.findById(project._id as string, [
      'ownerId',
      'members',
    ])) as IProject;
  }

  // Get user's projects (owned or member)
  async getUserProjects(userId: string, page: number = 1, limit: number = 10) {
    return await this.projectRepository.findProjectsWithPagination({}, page, limit, { userId });
  }

  // Get project by ID with permission check
  async getProjectById(projectId: string, userId: string): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId, ['ownerId', 'members']);

    if (!project || project.isDeleted) {
      throw new AppError('Project not found', 404);
    }

    // Check if user has access to this project
    const hasAccess = await this.projectRepository.isUserMemberOrOwner(projectId, userId);
    if (!hasAccess) {
      throw new AppError('Access denied to this project', 403);
    }

    return project;
  }

  // Update project
  async updateProject(
    projectId: string,
    userId: string,
    updateData: Partial<IProject>
  ): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.isDeleted) {
      throw new AppError('Project not found', 404);
    }

    // Only owner can update project
    const projectOwner = await this.projectRepository.getProjectOwner(projectId);
    if (projectOwner !== userId) {
      throw new AppError('Only project owner can update project', 403);
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description'];
    const updates: any = {};

    allowedUpdates.forEach((field) => {
      if (updateData[field as keyof IProject] !== undefined) {
        updates[field] = updateData[field as keyof IProject];
      }
    });

    const updatedProject = await this.projectRepository.findByIdAndUpdate(projectId, updates, {
      populate: ['ownerId', 'members'],
    });

    return updatedProject!;
  }

  // Add member to project
  async addMemberToProject(
    projectId: string,
    ownerId: string,
    memberEmail: string
  ): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.isDeleted) {
      throw new AppError('Project not found', 404);
    }

    // Only owner can add members
    if (project.ownerId.toString() !== ownerId) {
      throw new AppError('Only project owner can add members', 403);
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(memberEmail);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    // Check if already a member
    const isAlreadyMember = await this.projectRepository.isUserMemberOrOwner(
      projectId,
      user._id as string
    );
    if (isAlreadyMember) {
      throw new AppError('User is already a member of this project', 400);
    }

    return (await this.projectRepository.addMember(projectId, user._id as string)) as IProject;
  }

  // Remove member from project
  async removeMemberFromProject(
    projectId: string,
    ownerId: string,
    memberId: string
  ): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.isDeleted) {
      throw new AppError('Project not found', 404);
    }

    // Only owner can remove members
    if (project.ownerId.toString() !== ownerId) {
      throw new AppError('Only project owner can remove members', 403);
    }

    // Cannot remove owner
    if (project.ownerId.toString() === memberId) {
      throw new AppError('Cannot remove project owner', 400);
    }

    return (await this.projectRepository.removeMember(projectId, memberId)) as IProject;
  }

  // Soft delete project
  async deleteProject(projectId: string, userId: string): Promise<{ message: string }> {
    const project = await this.projectRepository.findById(projectId);

    if (!project || project.isDeleted) {
      throw new AppError('Project not found', 404);
    }

    // Only owner can delete project
    if (project.ownerId.toString() !== userId) {
      throw new AppError('Only project owner can delete project', 403);
    }

    await this.projectRepository.softDelete(projectId);
    return { message: 'Project deleted successfully' };
  }

  // Search projects
  async searchProjects(userId: string, query: string, page: number = 1, limit: number = 10) {
    const projects = await this.projectRepository.searchProjects(query, userId, {
      limit,
      skip: (page - 1) * limit,
    });

    const total = projects.length; // Approximate count

    return {
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
        hasMore: projects.length === limit,
      },
      query,
    };
  }

  // Get projects by owner
  async getProjectsByOwner(ownerId: string): Promise<IProject[]> {
    return await this.projectRepository.findByOwner(ownerId);
  }

  // Get project statistics
  async getProjectStats() {
    return await this.projectRepository.getProjectStats();
  }

  // Update project activity timestamp
  async updateProjectActivity(projectId: string): Promise<void> {
    await this.projectRepository.updateLastActivity(projectId);
  }

  // Restore deleted project
  async restoreProject(projectId: string, userId: string): Promise<IProject> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Only owner can restore project
    if (project.ownerId.toString() !== userId) {
      throw new AppError('Only project owner can restore project', 403);
    }

    return (await this.projectRepository.restore(projectId)) as IProject;
  }
}

// Export singleton instance for backward compatibility
export const projectService = new ProjectService();

// Export individual functions for backward compatibility
export const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addMemberToProject,
  removeMemberFromProject,
  deleteProject,
  searchProjects,
} = projectService;
