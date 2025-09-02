import { User, IUser, UserRole } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";
import { register } from "./auth.service";

// Get all users (admin only)
export const getAllUsers = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const users = await User.find()
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();
  
  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasMore: skip + limit < total
    }
  };
};

// Get user by ID
export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password -refreshTokens');
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

// Update user role (admin only)
export const updateUserRole = async (userId: string, role: UserRole) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.role = role;
  await user.save();
  
  return await User.findById(userId).select('-password -refreshTokens');
};

// Activate/Deactivate user (admin only)
export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = isActive;
  
  // If deactivating, clear all refresh tokens to force logout
  if (!isActive) {
    user.refreshTokens = [];
  }
  
  await user.save();
  
  return await User.findById(userId).select('-password -refreshTokens');
};

// Delete user (admin only)
export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent admins from deleting themselves
  if (user.role === UserRole.ADMIN) {
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    if (adminCount <= 1) {
      throw new AppError("Cannot delete the last admin user", 400);
    }
  }

  await User.findByIdAndDelete(userId);
  return { message: "User deleted successfully" };
};

// Create admin user (super admin only or initial setup)
export const createAdminUser = async (name: string, email: string, password: string) => {
  return await register(name, email, password, UserRole.ADMIN);
};

// Get user statistics
export const getUserStats = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const adminUsers = await User.countDocuments({ role: UserRole.ADMIN });
  const regularUsers = await User.countDocuments({ role: UserRole.USER });
  
  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRegistrations = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo }
  });

  return {
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    adminUsers,
    regularUsers,
    recentRegistrations
  };
};

// Search users
export const searchUsers = async (query: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    $or: [
      { name: searchRegex },
      { email: searchRegex }
    ]
  };

  const users = await User.find(searchQuery)
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(searchQuery);
  
  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasMore: skip + limit < total
    },
    query
  };
};
