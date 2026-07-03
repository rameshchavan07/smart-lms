import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255).optional(),
  description: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  teacherId: z.string().uuid().optional(),
});
