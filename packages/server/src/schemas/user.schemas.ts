import { z } from "zod";

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
