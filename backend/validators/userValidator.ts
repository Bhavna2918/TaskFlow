import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim().optional(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase().optional(),
  avatar: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  productivity: z.number().min(0).max(100).optional(),
  completionRate: z.number().min(0).max(100).optional(),
  performanceScore: z.number().min(0).max(10).optional(),
  twoFactorEnabled: z.boolean().optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  team: z.string().optional()
});
