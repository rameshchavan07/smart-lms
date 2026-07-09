import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../src/config/db';
import { registerUserLogic, verifyEmailLogic } from '../src/services/authService';
import * as otpService from '../src/services/otpService';
import * as emailService from '../src/services/emailService';
import * as jwtUtils from '../src/utils/jwt';
import bcrypt from 'bcrypt';

// Mock dependencies
vi.mock('../src/config/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    student: {
      create: vi.fn(),
    },
    teacher: {
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/services/otpService', () => ({
  createOtp: vi.fn(),
  verifyOtp: vi.fn(),
  deleteOtpsForEmail: vi.fn(),
}));

vi.mock('../src/services/emailService', () => ({
  sendEmailVerificationOtp: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetOtp: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/utils/jwt', () => ({
  generateToken: vi.fn(() => 'mock-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
}));

vi.mock('../src/utils/auditLogger', () => ({
  logActivity: vi.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUserLogic', () => {
    const mockRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'STUDENT',
    };

    it('should throw an error if user already exists', async () => {
      // Setup mock to return an existing user
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 'existing-id', email: mockRegisterData.email });

      await expect(registerUserLogic(mockRegisterData)).rejects.toThrow('An account with this email already exists.');
    });

    it('should successfully register a new student user', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      (prisma.user.create as any).mockResolvedValueOnce({ id: 'new-user-id', ...mockRegisterData });
      (prisma.student.create as any).mockResolvedValueOnce({});
      (otpService.createOtp as any).mockResolvedValueOnce('123456');

      const result = await registerUserLogic(mockRegisterData);

      expect(result).toEqual({ email: mockRegisterData.email });
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.student.create).toHaveBeenCalledTimes(1);
      expect(prisma.teacher.create).not.toHaveBeenCalled();
      expect(otpService.createOtp).toHaveBeenCalledWith(mockRegisterData.email, 'EMAIL_VERIFICATION');
      expect(emailService.sendEmailVerificationOtp).toHaveBeenCalledWith(mockRegisterData.email, mockRegisterData.firstName, '123456');
    });
  });

  describe('verifyEmailLogic', () => {
    const mockEmail = 'john@example.com';
    const mockOtp = '123456';

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);

      await expect(verifyEmailLogic(mockEmail, mockOtp)).rejects.toThrow('User not found.');
    });

    it('should throw error if user is already verified', async () => {
      (prisma.user.findUnique as any).mockResolvedValueOnce({ id: 'user-id', email: mockEmail, isEmailVerified: true });

      await expect(verifyEmailLogic(mockEmail, mockOtp)).rejects.toThrow('Email is already verified. Please log in.');
    });

    it('should verify email and return tokens on success', async () => {
      const mockUser = { id: 'user-id', email: mockEmail, isEmailVerified: false, role: 'STUDENT', firstName: 'John' };
      (prisma.user.findUnique as any).mockResolvedValueOnce(mockUser);
      (otpService.verifyOtp as any).mockResolvedValueOnce({ success: true });
      (prisma.user.update as any).mockResolvedValueOnce({ ...mockUser, isEmailVerified: true });
      (emailService.sendWelcomeEmail as any).mockResolvedValueOnce(Promise.resolve());

      const result = await verifyEmailLogic(mockEmail, mockOtp);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(mockEmail, mockOtp, 'EMAIL_VERIFICATION');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isEmailVerified: true },
      });
      expect(result).toHaveProperty('token', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
    });
  });
});
