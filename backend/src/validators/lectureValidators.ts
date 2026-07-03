import { z } from 'zod';

export const createLectureSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format (must be ISO 8601 string)' }),
  endTime: z.string().datetime({ message: 'Invalid end time format (must be ISO 8601 string)' }),
}).refine(data => {
  return new Date(data.startTime) < new Date(data.endTime);
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});
