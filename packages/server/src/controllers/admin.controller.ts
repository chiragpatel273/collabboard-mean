import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { UserRole } from "../models/user.model";
import { configService } from "../config/config";
import { adminService } from "../services/admin.service";

// Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await adminService.getAllUsers(page, limit);
  
  res.json({
    message: "Users retrieved successfully",
    ...result
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await adminService.getUserById(userId);
  
  res.json({
    message: "User retrieved successfully",
    user
  });
});

// Update user role
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`
    });
  }
  
  const user = await adminService.updateUserRole(userId, role);
  
  res.json({
    message: "User role updated successfully",
    user
  });
});

// Activate/Deactivate user
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isActive } = req.body;
  
  const user = await adminService.toggleUserStatus(userId, isActive);
  
  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await adminService.deleteUser(userId);
  
  res.json(result);
});

// Create admin user
export const createAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await adminService.createAdminUser(name, email, password);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: configService.isProduction(),
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(201).json({
    message: "Admin user created successfully",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Get user statistics
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getUserStats();
  
  res.json({
    message: "User statistics retrieved successfully",
    stats
  });
});

// Search users
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required"
    });
  }
  
  const result = await adminService.searchUsers(query, page, limit);
  
  res.json({
    message: "Search completed successfully",
    ...result
  });
});
