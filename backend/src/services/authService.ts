import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { UserRole } from '@prisma/client';

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  address?: string;
  role?: UserRole;
}
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { logActivity } from '../utils/auditLogger';
import { createOtp, verifyOtp, deleteOtpsForEmail } from './otpService';
import {
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
  sendWelcomeEmail,
} from './emailService';
import { OtpType, User } from '@prisma/client';

export const buildAuthResponse = async (user: User) => {
  const token = generateToken(user.id, user.role, user.instituteId);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    tourCompleted: user.tourCompleted,
    token,
    refreshToken,
  };
};

export const registerUserLogic = async (data: RegisterUserData) => {
  const { firstName, lastName, email, password, phoneNumber, address, role } = data;
  
  const userRole = (role === 'TEACHER' || role === 'ADMIN') ? role : 'STUDENT';

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    throw new Error('An account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password || '', salt);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      passwordHash,
      role: userRole,
      isEmailVerified: false,
    },
  });

  if (userRole === 'STUDENT') {
    await prisma.student.create({
      data: {
        userId: user.id,
        enrollmentNumber: `STU-${Date.now()}`,
      },
    });
  } else if (userRole === 'TEACHER') {
    await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeCode: `EMP-${Date.now()}`,
        joiningDate: new Date(),
      },
    });
  }

  const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
  await sendEmailVerificationOtp(email, firstName, otp);
  await logActivity(user.id, 'Registered account — awaiting email verification', 'User', user.id);

  return { email };
};

export const verifyEmailLogic = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found.');
  if (user.isEmailVerified) throw new Error('Email is already verified. Please log in.');

  const result = await verifyOtp(email, otp, OtpType.EMAIL_VERIFICATION);
  if (!result.success) throw new Error(result.error);

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });

  sendWelcomeEmail(email, user.firstName).catch(console.error);
  await logActivity(user.id, 'Email verified successfully', 'User', user.id);

  return buildAuthResponse(user);
};

export const resendOtpLogic = async (email: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => {
  const otpType = type === 'PASSWORD_RESET' ? OtpType.PASSWORD_RESET : OtpType.EMAIL_VERIFICATION;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    const otp = await createOtp(email, otpType);
    if (otpType === OtpType.EMAIL_VERIFICATION) {
      await sendEmailVerificationOtp(email, user.firstName, otp);
    } else {
      await sendPasswordResetOtp(email, user.firstName, otp);
    }
  }
};
