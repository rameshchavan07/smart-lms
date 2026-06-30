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

// ─── Helper: Set Auth Cookies ───────────────────────────────────────────────
export const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
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
    token,
    refreshToken,
  };
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'STUDENT',
        isEmailVerified: false,
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        enrollmentNumber: `STU-${Date.now()}`,
      },
    });

    // Generate & send OTP
    const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
    await sendEmailVerificationOtp(email, firstName, otp);

    await logActivity(user.id, 'Registered account — awaiting email verification', 'User', user.id);

    res.status(201).json({
      message: 'Registration successful. Please check your email for a 6-digit verification code.',
      email,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: 'Email is already verified. Please log in.' });
      return;
    }

    const result = await verifyOtp(email, otp, OtpType.EMAIL_VERIFICATION);
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, user.firstName).catch(console.error);

    await logActivity(user.id, 'Email verified successfully', 'User', user.id);

    const authData = await buildAuthResponse(user);
    setAuthCookies(res, authData.token, authData.refreshToken);
    const { token, refreshToken, ...userData } = authData;
    
    res.status(200).json({
      message: 'Email verified successfully. Welcome!',
      ...userData,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, type } = req.body;

    const otpType = type === 'PASSWORD_RESET' ? OtpType.PASSWORD_RESET : OtpType.EMAIL_VERIFICATION;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generic message to prevent email enumeration
      res.status(200).json({ message: 'If that email exists, a new OTP has been sent.' });
      return;
    }

    const otp = await createOtp(email, otpType);

    if (otpType === OtpType.EMAIL_VERIFICATION) {
      await sendEmailVerificationOtp(email, user.firstName, otp);
    } else {
      await sendPasswordResetOtp(email, user.firstName, otp);
    }

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Your account has been disabled. Please contact support.' });
      return;
    }

    if (!user.isEmailVerified) {
      // Re-send OTP so they can complete verification
      const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
      await sendEmailVerificationOtp(email, user.firstName, otp);
      res.status(403).json({
        message: 'Your email is not verified. A new verification code has been sent to your email.',
        requiresVerification: true,
        email,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    await logActivity(user.id, 'Logged in to dashboard', 'User', user.id);

    const authData = await buildAuthResponse(user);
    setAuthCookies(res, authData.token, authData.refreshToken);
    const { token, refreshToken, ...userData } = authData;
    res.json(userData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Generic response to prevent email enumeration
      res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
      return;
    }

    if (!user.passwordHash) {
      // Google-only account — no password to reset
      res.status(400).json({ message: 'This account uses Google Sign-In. Please log in with Google.' });
      return;
    }

    const otp = await createOtp(email, OtpType.PASSWORD_RESET);
    await sendPasswordResetOtp(email, user.firstName, otp);

    res.status(200).json({ message: 'A password reset OTP has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── VERIFY RESET OTP ─────────────────────────────────────────────────────────
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtp(email, otp, OtpType.PASSWORD_RESET);
    if (!result.success) {
      res.status(400).json({ message: result.error });
      return;
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.OTP_RESET_SECRET!);
    } catch {
      res.status(400).json({ message: 'Reset token is invalid or has expired. Please start over.' });
      return;
    }

    if (decoded.purpose !== 'password_reset') {
      res.status(400).json({ message: 'Invalid reset token.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GOOGLE OAUTH CALLBACK ────────────────────────────────────────────────────
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
      return;
    }

    const authData = await buildAuthResponse(user);
    await logActivity(user.id, 'Logged in via Google OAuth', 'User', user.id);

    // Redirect to frontend without tokens in query params; cookies are now used.
    setAuthCookies(res, authData.token, authData.refreshToken);
    const params = new URLSearchParams({
      role: authData.role,
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
  }
};

// ─── EXISTING ENDPOINTS (unchanged) ──────────────────────────────────────────

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(req.user);
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token provided' });
      return;
    }

    const savedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!savedToken || savedToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const decoded: any = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const newToken = generateToken(user.id, user.role);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: 'Token refreshed successfully' });
  } catch (error: any) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
