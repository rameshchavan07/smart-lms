import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { generateUniqueSlug } from '../utils/slugify';
import { createOtp } from '../services/otpService';
import { sendEmailVerificationOtp } from '../services/emailService';
import {
  sendRegistrationPendingEmail,
  sendNewInstituteNotification,
} from '../services/instituteEmailService';
import { logActivity } from '../utils/auditLogger';
import { catchAsync } from '../utils/catchAsync';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/AppError';
import { OtpType } from '@prisma/client';
import { buildAuthResponse } from '../services/authService';
import { setAuthCookies } from './authController';

// ─── REGISTER INSTITUTE (Public) ─────────────────────────────────────────────
export const registerInstitute = catchAsync(async (req: Request, res: Response) => {
  const { instituteName, firstName, lastName, email, password, phone, address, website } = req.body;

  if (!instituteName || !firstName || !lastName || !email || !password) {
    throw new ValidationError('Institute name, admin first name, last name, email, and password are required.');
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ValidationError('An account with this email already exists.');
  }

  const slug = await generateUniqueSlug(instituteName);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create institute + admin user in a transaction
  const { institute, user } = await prisma.$transaction(async (tx) => {
    const institute = await tx.institute.create({
      data: {
        name: instituteName,
        slug,
        phone,
        address,
        website,
        email,
        status: 'PENDING',
      },
    });

    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'ADMIN',
        instituteId: institute.id,
        isEmailVerified: false,
      },
    });

    return { institute, user };
  });

  // Send OTP for email verification
  const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
  await sendEmailVerificationOtp(email, firstName, otp);

  // Notify Super Admins about the new pending registration
  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { email: true },
  });

  for (const sa of superAdmins) {
    sendNewInstituteNotification(sa.email, instituteName, email).catch(console.error);
  }

  await logActivity(user.id, `Registered new institute: ${instituteName}`, 'Institute', institute.id);

  res.status(201).json({
    message: 'Institute registration submitted. Please verify your email. Your institute is pending Super Admin approval.',
    instituteSlug: slug,
    email,
  });
});

// ─── REGISTER STUDENT FOR INSTITUTE (Public, requires approved institute) ────
export const registerStudentForInstitute = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { firstName, lastName, email, password, phoneNumber, address } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new ValidationError('First name, last name, email, and password are required.');
  }

  // Look up institute by slug
  const institute = await prisma.institute.findUnique({ where: { slug: slug as string } });
  if (!institute) throw new NotFoundError('Institute not found.');

  if (institute.status !== 'APPROVED') {
    throw new ForbiddenError('This institute is not yet active. Please contact the institute administrator.');
  }

  if (institute.allowedEmailDomain) {
    const emailDomain = email.split('@')[1];
    if (emailDomain !== institute.allowedEmailDomain) {
      throw new ValidationError(`This institute only allows registration with @${institute.allowedEmailDomain} email addresses.`);
    }
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ValidationError('An account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      passwordHash,
      role: 'STUDENT',
      instituteId: institute.id,
      isEmailVerified: false,
      isApproved: !institute.isPrivate,
      student: {
        create: {
          enrollmentNumber: `STU-${Date.now()}`,
          academicYear: new Date().getFullYear().toString(),
          admissionDate: new Date(),
        },
      },
    },
  });

  // Send OTP for email verification
  const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
  await sendEmailVerificationOtp(email, firstName, otp);

  await logActivity(user.id, `Registered as student for institute: ${institute.name}`, 'User', user.id);

  const successMessage = institute.isPrivate 
    ? 'Registration submitted! Please verify your email. Your application must be approved by an administrator before you can log in.'
    : 'Registration successful. Please check your email for a 6-digit verification code.';

  res.status(201).json({
    message: successMessage,
    email,
    instituteSlug: slug,
  });
});

// ─── LOGIN FOR INSTITUTE (Public, requires approved institute) ───────────────
export const loginForInstitute = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required.');
  }

  // Look up institute by slug
  const institute = await prisma.institute.findUnique({ where: { slug: slug as string } });
  if (!institute) throw new NotFoundError('Institute not found.');

  // Allow PENDING institute admins to log in (they see a "pending" page)
  // Block REJECTED and SUSPENDED for everyone
  if (institute.status === 'REJECTED') {
    throw new ForbiddenError('This institute registration was not approved.');
  }
  if (institute.status === 'SUSPENDED') {
    throw new ForbiddenError('This institute has been temporarily deactivated. Please contact the platform administrator.');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw new ValidationError('Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ForbiddenError('Your account has been disabled. Please contact support.');
  }

  if (!user.isApproved && user.role !== 'ADMIN') {
    throw new ForbiddenError('Your account is pending approval from the institute administrator.');
  }

  // Verify user belongs to this institute
  if (user.instituteId !== institute.id) {
    throw new ValidationError('Invalid email or password.');
  }

  // For PENDING institutes, only ADMIN can log in
  if (institute.status === 'PENDING' && user.role !== 'ADMIN') {
    throw new ForbiddenError('This institute is pending approval. Only the institute admin can access it.');
  }

  if (!user.isEmailVerified) {
    const otp = await createOtp(email, OtpType.EMAIL_VERIFICATION);
    sendEmailVerificationOtp(email, user.firstName, otp).catch(console.error);
    throw new ForbiddenError('Your email is not verified. A new verification code has been sent to your email.');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new ValidationError('Invalid email or password.');
  }

  await logActivity(user.id, `Logged in via institute: ${institute.name}`, 'User', user.id);

  const authData = await buildAuthResponse(user);
  setAuthCookies(res, authData.token, authData.refreshToken);

  const { token, refreshToken, ...userData } = authData;
  res.json({ ...userData, instituteSlug: slug });
});
