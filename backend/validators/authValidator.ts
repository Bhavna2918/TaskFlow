import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['admin', 'manager', 'employee']).default('employee'),
  team: z.string().optional().default(''),
  avatar: z.string().optional().default('')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase()
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long')
});
