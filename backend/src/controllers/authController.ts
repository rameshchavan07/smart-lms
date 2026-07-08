import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/auditLogger';
import { createOtp, verifyOtp, deleteOtpsForEmail } from '../services/otpService';
import {
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
  sendWelcomeEmail,
} from '../services/emailService';
import { OtpType, User } from '@prisma/client';
import { registerUserLogic, verifyEmailLogic, resendOtpLogic } from '../services/authService';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../utils/AppError';

// ─── Helper: Set Auth Cookies ───────────────────────────────────────────────
export const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production' || (!!process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'));
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
};

// ─── Helper: build auth response ────────────────────────────────────────────
const buildAuthResponse = async (user: User) => {
  const token = generateToken(user.id, user.role);
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

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email } = await registerUserLogic(req.body);
    res.status(201).json({
      message: 'Registration successful. Please check your email for a 6-digit verification code.',
      email,
    });
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : String(error));
  }
});

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const { token, refreshToken, ...user } = await verifyEmailLogic(email, otp);
    
    setAuthCookies(res, token, refreshToken);

    res.status(200).json({
      message: 'Email verified successfully.',
      token,
      refreshToken,
      user,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'User not found.') throw new NotFoundError(msg);
    else throw new ValidationError(msg);
  }
});

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, type } = req.body;
  await resendOtpLogic(email, type);
  res.status(200).json({ message: 'If an account exists, a new OTP has been sent.' });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { institute: { select: { slug: true, status: true } } },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ForbiddenError('Your account has been disabled. Please contact support.');
  }

  // Check if the user's institute is active (if they belong to one)
  if (user.institute) {
    if (user.institute.status === 'SUSPENDED') {
      throw new ForbiddenError('Your institute has been temporarily deactivated. Please contact the platform administrator.');
    }
    if (user.institute.status === 'REJECTED') {
      throw new ForbiddenError('Your institute registration was not approved.');
    }
  }

  if (!user.isEmailVerified) {
    // Re-send OTP so they can complete verification — wrapped in try/catch to prevent email failures from blocking the error response
    try {
      const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
      await sendEmailVerificationOtp(email, user.firstName, otp);
    } catch (emailErr) {
      console.error('Failed to send verification OTP during login:', emailErr);
    }
    throw new ForbiddenError('Your email is not verified. A new verification code has been sent to your email.');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  await logActivity(user.id, 'Logged in to dashboard', 'User', user.id);

  const authData = await buildAuthResponse(user);
  setAuthCookies(res, authData.token, authData.refreshToken);
  const { token, refreshToken, ...userData } = authData;
  res.json({
    ...userData,
    instituteSlug: user.institute?.slug || null,
  });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Generic response to prevent email enumeration
    res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    return;
  }

  if (!user.passwordHash) {
    // Google-only account — no password to reset
    throw new ValidationError('This account uses Google Sign-In. Please log in with Google.');
  }

  const otp = await createOtp(email, OtpType.PASSWORD_RESET);
  await sendPasswordResetOtp(email, user.firstName, otp);

  res.status(200).json({ message: 'A password reset OTP has been sent to your email.' });
});

// ─── VERIFY RESET OTP ─────────────────────────────────────────────────────────
export const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await verifyOtp(email, otp, OtpType.PASSWORD_RESET);
  if (!result.success) {
    throw new ValidationError(result.error || 'Verification failed');
  }

  // Issue a short-lived reset token (15 minutes)
  const resetToken = jwt.sign(
    { email, purpose: 'password_reset' },
    process.env.OTP_RESET_SECRET!,
    { expiresIn: '15m' }
  );

  res.status(200).json({
    message: 'OTP verified. You can now reset your password.',
    resetToken,
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { resetToken, newPassword } = req.body;

  let decoded: { email: string; purpose: string };
  try {
    decoded = jwt.verify(resetToken, process.env.OTP_RESET_SECRET!) as { email: string; purpose: string };
  } catch {
    throw new ValidationError('Reset token is invalid or has expired. Please start over.');
  }

  if (decoded.purpose !== 'password_reset') {
    throw new ValidationError('Invalid reset token.');
  }

  const user = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate all refresh tokens for security
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  // Clean up all OTPs
  await deleteOtpsForEmail(decoded.email);

  await logActivity(user.id, 'Password reset successfully', 'User', user.id);

  res.status(200).json({ message: 'Password reset successfully. Please log in with your new password.' });
});

// ─── GOOGLE OAUTH CALLBACK ────────────────────────────────────────────────────
export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User & { _oauthState?: { instituteSlug?: string; action?: string } };
  if (!user) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    return;
  }

  const authData = await buildAuthResponse(user);
  await logActivity(user.id, 'Logged in via Google OAuth', 'User', user.id);

  // Redirect to frontend without tokens in query params; cookies are now used.
  setAuthCookies(res, authData.token, authData.refreshToken);
  
  const queryParams: Record<string, string> = {
    role: authData.role,
  };

  if (user._oauthState?.instituteSlug) {
    queryParams.instituteSlug = user._oauthState.instituteSlug;
  }

  const params = new URLSearchParams(queryParams);

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
});

// ─── EXISTING ENDPOINTS (unchanged) ──────────────────────────────────────────

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  // Fetch institute slug if user belongs to an institute
  let instituteSlug: string | null = null;
  if (req.user?.instituteId) {
    const institute = await prisma.institute.findUnique({
      where: { id: req.user.instituteId },
      select: { slug: true },
    });
    instituteSlug = institute?.slug || null;
  }

  res.json({ ...req.user, instituteSlug });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token provided');
  }

  const savedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!savedToken || savedToken.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const decoded = verifyRefreshToken(refreshToken) as { id: string };
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const newToken = generateToken(user.id, user.role);
  const isProd = process.env.NODE_ENV === 'production' || (!!process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'));
  res.cookie('token', newToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.json({ message: 'Token refreshed successfully' });
});

export const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const savedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (savedToken) {
      await logActivity(savedToken.userId, 'Logged out', 'User', savedToken.userId);
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
  }
  clearAuthCookies(res);
  res.status(200).json({ message: 'Logged out successfully' });
});
