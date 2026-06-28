import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

// ─── Course Schemas ───────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  teacherId: z.string().uuid().optional(),
  maxStudents: z.number().int().positive().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

// ─── Lecture Schemas ──────────────────────────────────────────────────────────
export const createLectureSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

// ─── Quiz Schemas ─────────────────────────────────────────────────────────────
export const createQuizSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  durationMins: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive(),
  questions: z.array(
    z.object({
      text: z.string().min(1),
      marks: z.number().int().positive(),
      options: z.array(
        z.object({
          text: z.string().min(1),
          isCorrect: z.boolean(),
        })
      ).min(2, 'At least two options are required'),
    })
  ).min(1, 'At least one question is required'),
});
