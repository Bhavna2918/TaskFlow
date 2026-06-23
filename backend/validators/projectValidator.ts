import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').trim(),
  description: z.string().optional(),
  members: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member user ID format')).optional().default([])
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').trim().optional(),
  description: z.string().optional(),
  members: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid member user ID format')).optional(),
  tasks: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID format')).optional()
});
