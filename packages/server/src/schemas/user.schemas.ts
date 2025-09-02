import { z } from "zod";
import { UserRole } from "../models/user.model";

// Simple validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"),
  password: z.string().min(1, "Password is required")
});

// Admin validation schemas
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: `Role must be one of: ${Object.values(UserRole).join(', ')}`
  })
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean({
    message: "isActive must be a boolean"
  })
});
