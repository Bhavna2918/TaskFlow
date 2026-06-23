import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').trim(),
  description: z.string().optional(),
  assignedToId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Assigned User ID format'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  status: z.enum(['To Do', 'In Progress', 'Review', 'Completed']).default('To Do'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format'),
  category: z.string().optional().default('General'),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Project ID format').optional().nullable(),
  labels: z.array(z.string()).optional().default([])
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').trim().optional(),
  description: z.string().optional(),
  assignedToId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Assigned User ID format').optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['To Do', 'In Progress', 'Review', 'Completed']).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format').optional(),
  category: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Project ID format').optional().nullable(),
  labels: z.array(z.string()).optional(),
  comments: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional()
});
