import { Project, IProject } from "../models/project.model";
import { User } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";
import mongoose from "mongoose";

// Create new project
export const createProject = async (name: string, description: string | undefined, ownerId: string): Promise<IProject> => {
  const project = new Project({
    name,
    description,
    ownerId,
    members: [ownerId], // Owner is automatically a member
    isActive: true
  });

  await project.save();
  return await Project.findById(project._id)
    .populate("ownerId", "name email")
    .populate("members", "name email") as IProject;
};

// Get user's projects (owned or member)
export const getUserProjects = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const projects = await Project.find({
    $and: [
      { isActive: true },
      { $or: [{ ownerId: userId }, { members: userId }] }
    ]
  })
    .populate("ownerId", "name email")
    .populate("members", "name email")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments({
    $and: [
      { isActive: true },
      { $or: [{ ownerId: userId }, { members: userId }] }
    ]
  });

  return {
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      hasMore: skip + limit < total
    }
  };
};

// Get project by ID with permission check
export const getProjectById = async (projectId: string, userId: string): Promise<IProject> => {
  const project = await Project.findById(projectId)
    .populate("ownerId", "name email")
    .populate("members", "name email");

  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  // Check if user has access to this project
  const hasAccess = project.ownerId._id.toString() === userId || 
                   project.members.some(member => member._id.toString() === userId);
  
  if (!hasAccess) {
    throw new AppError("Access denied to this project", 403);
  }

  return project;
};

// Update project
export const updateProject = async (projectId: string, userId: string, updateData: Partial<IProject>): Promise<IProject> => {
  const project = await Project.findById(projectId);
  
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can update project
  if (project.ownerId.toString() !== userId) {
    throw new AppError("Only project owner can update project", 403);
  }

  // Update allowed fields
  const allowedUpdates = ["name", "description"];
  const updates: any = {};
  
  allowedUpdates.forEach(field => {
    if (updateData[field as keyof IProject] !== undefined) {
      updates[field] = updateData[field as keyof IProject];
    }
  });

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updates,
    { new: true, runValidators: true }
  )
    .populate("ownerId", "name email")
    .populate("members", "name email");

  return updatedProject!;
};

// Add member to project
export const addMemberToProject = async (projectId: string, ownerId: string, memberEmail: string): Promise<IProject> => {
  const project = await Project.findById(projectId);
  
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can add members
  if (project.ownerId.toString() !== ownerId) {
    throw new AppError("Only project owner can add members", 403);
  }

  // Find user by email
  const user = await User.findOne({ email: memberEmail, isActive: true });
  if (!user) {
    throw new AppError("User not found or inactive", 404);
  }

  // Check if already a member
  if (project.members.includes(user._id as mongoose.Types.ObjectId)) {
    throw new AppError("User is already a member of this project", 400);
  }

  project.members.push(user._id as mongoose.Types.ObjectId);
  await project.save();

  return await Project.findById(projectId)
    .populate("ownerId", "name email")
    .populate("members", "name email") as IProject;
};

// Remove member from project
export const removeMemberFromProject = async (projectId: string, ownerId: string, memberId: string): Promise<IProject> => {
  const project = await Project.findById(projectId);
  
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can remove members
  if (project.ownerId.toString() !== ownerId) {
    throw new AppError("Only project owner can remove members", 403);
  }

  // Cannot remove owner
  if (project.ownerId.toString() === memberId) {
    throw new AppError("Cannot remove project owner", 400);
  }

  project.members = project.members.filter(member => member.toString() !== memberId);
  await project.save();

  return await Project.findById(projectId)
    .populate("ownerId", "name email")
    .populate("members", "name email") as IProject;
};

// Soft delete project
export const deleteProject = async (projectId: string, userId: string): Promise<{ message: string }> => {
  const project = await Project.findById(projectId);
  
  if (!project || !project.isActive) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can delete project
  if (project.ownerId.toString() !== userId) {
    throw new AppError("Only project owner can delete project", 403);
  }

  // Soft delete
  project.isActive = false;
  await project.save();

  return { message: "Project deleted successfully" };
};

// Search projects
export const searchProjects = async (userId: string, query: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const searchQuery = {
    $and: [
      { isActive: true },
      { $or: [{ ownerId: userId }, { members: userId }] },
      { $text: { $search: query } }
    ]
  };

  const projects = await Project.find(searchQuery)
    .populate("ownerId", "name email")
    .populate("members", "name email")
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(searchQuery);

  return {
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      hasMore: skip + limit < total
    },
    query
  };
};
