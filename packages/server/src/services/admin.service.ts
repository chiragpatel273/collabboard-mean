import { UserRole } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";
import { UserRepository } from "../repositories";
import { authService } from "./auth.service";

export class AdminService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Get all users (admin only)
  async getAllUsers(page: number = 1, limit: number = 10) {
    return await this.userRepository.findUsersWithPagination({}, page, limit);
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userRepository.findById(userId, '-password -refreshTokens');
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await this.userRepository.updateRole(userId, role);
    return updatedUser;
  }

  // Activate/Deactivate user (admin only)
  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let updatedUser;
    if (isActive) {
      updatedUser = await this.userRepository.activateUser(userId);
    } else {
      updatedUser = await this.userRepository.deactivateUser(userId);
    }

    return updatedUser;
  }

  // Delete user (admin only)
  async deleteUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent admins from deleting themselves
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.userRepository.countDocuments({ role: UserRole.ADMIN });
      if (adminCount <= 1) {
        throw new AppError("Cannot delete the last admin user", 400);
      }
    }

    await this.userRepository.findByIdAndDelete(userId);
    return { message: "User deleted successfully" };
  }

  // Create admin user (super admin only or initial setup)
  async createAdminUser(name: string, email: string, password: string) {
    return await authService.register(name, email, password, UserRole.ADMIN);
  }

  // Get user statistics
  async getUserStats() {
    return await this.userRepository.getUserStats();
  }

  // Search users
  async searchUsers(query: string, page: number = 1, limit: number = 10) {
    const users = await this.userRepository.searchUsers(query, { 
      limit, 
      skip: (page - 1) * limit 
    });
    
    const total = users.length; // This is approximate - for exact count, would need separate query
    
    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: users.length === limit
      },
      query
    };
  }

  // Get users by role
  async getUsersByRole(role: UserRole, page: number = 1, limit: number = 10) {
    return await this.userRepository.findUsersWithPagination({}, page, limit, { role });
  }

  // Get active/inactive users
  async getUsersByStatus(isActive: boolean, page: number = 1, limit: number = 10) {
    return await this.userRepository.findUsersWithPagination({}, page, limit, { isActive });
  }
}

// Export singleton instance for backward compatibility
export const adminService = new AdminService();

// Export individual functions for backward compatibility
export const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  createAdminUser,
  getUserStats,
  searchUsers
} = adminService;
