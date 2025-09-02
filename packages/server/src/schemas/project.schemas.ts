import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../models/task.model';

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z
    .nativeEnum(TaskPriority, {
      message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
    })
    .optional(),
  dueDate: z
    .string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date format')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z
    .nativeEnum(TaskPriority, {
      message: `Priority must be one of: ${Object.values(TaskPriority).join(', ')}`,
    })
    .optional(),
  dueDate: z
    .string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid date format')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  }),
});

export const assignTaskSchema = z.object({
  assignedTo: z.string().optional(), // Can be undefined to unassign
});
