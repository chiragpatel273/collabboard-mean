import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.model";
import { AppError } from "./error.middleware";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Middleware to check if user has required role
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(user.role)) {
      throw new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403);
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireAdmin = requireRole(UserRole.ADMIN);

export const requireUser = requireRole(UserRole.USER, UserRole.ADMIN);

// Middleware to check if user can access their own resource or is admin
export const requireOwnershipOrAdmin = (getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    const resourceUserId = getUserId(req);

    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    // Admin can access any resource, users can only access their own
    if (user.role === UserRole.ADMIN || user.id === resourceUserId) {
      return next();
    }

    throw new AppError("Access denied. You can only access your own resources", 403);
  };
};

// Check if current user is admin
export const isAdmin = (req: Request): boolean => {
  const user = (req as AuthenticatedRequest).user;
  return user?.role === UserRole.ADMIN;
};

// Check if current user owns the resource or is admin
export const canAccessResource = (req: Request, resourceUserId: string): boolean => {
  const user = (req as AuthenticatedRequest).user;
  return user?.role === UserRole.ADMIN || user?.id === resourceUserId;
};
