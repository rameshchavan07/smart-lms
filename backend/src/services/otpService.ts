import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { OtpType } from '@prisma/client';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit OTP string.
 */
const generateRawOtp = (): string => {
  const bytes = crypto.randomBytes(3); // 3 bytes → up to 16777215
  const num = bytes.readUIntBE(0, 3) % 1000000;
  return num.toString().padStart(6, '0');
};

/**
 * Create and persist a new OTP for the given email + type.
 * Deletes any existing unused OTPs of the same type first.
 * Returns the plaintext OTP (to be sent via email).
 */
export const createOtp = async (email: string, type: OtpType): Promise<string> => {
  // Clean up any old OTPs of same type for this email
  await prisma.otpToken.deleteMany({ where: { email, type } });

  const rawOtp = generateRawOtp();
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpToken.create({
    data: { email, otpHash, type, expiresAt },
  });

  return rawOtp;
};

/**
 * Verify an OTP. Returns true on success and invalidates the OTP.
 * Returns a descriptive error string on failure.
 */
export const verifyOtp = async (
  email: string,
  rawOtp: string,
  type: OtpType
): Promise<{ success: boolean; error?: string }> => {
  const token = await prisma.otpToken.findFirst({
    where: { email, type, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  if (token.expiresAt < new Date()) {
    await prisma.otpToken.delete({ where: { id: token.id } });
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  if (token.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpToken.delete({ where: { id: token.id } });
    return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(rawOtp, token.otpHash);

  if (!isMatch) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: token.attempts + 1 },
    });
    const remaining = MAX_OTP_ATTEMPTS - token.attempts - 1;
    return { success: false, error: `Incorrect OTP. ${remaining} attempt(s) remaining.` };
  }

  // Mark as used
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });

  return { success: true };
};

/**
 * Delete all OTPs for a given email (called after password reset completes).
 */
export const deleteOtpsForEmail = async (email: string): Promise<void> => {
  await prisma.otpToken.deleteMany({ where: { email } });
};
