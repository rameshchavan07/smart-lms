import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ForbiddenError } from '../utils/AppError';
import prisma from '../config/db';
import { logActivity } from '../utils/auditLogger';
import { sendNotification } from '../services/notifications.service';

// ─── GET PENDING APPLICATIONS ───────────────────────────────────────────────
export const getPendingApplications = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { instituteId: true }
  });

  if (!user || !user.instituteId) {
    throw new NotFoundError('Institute not found');
  }

  const pendingUsers = await prisma.user.findMany({
    where: {
      instituteId: user.instituteId,
      isApproved: false,
      role: 'STUDENT',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ applications: pendingUsers });
});

// ─── APPROVE APPLICATION ────────────────────────────────────────────────────
export const approveApplication = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const userToApprove = await prisma.user.findUnique({
    where: { id: id as string },
    select: { instituteId: true, firstName: true }
  });

  if (!userToApprove) {
    throw new NotFoundError('User not found');
  }

  const admin = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { instituteId: true }
  });

  if (!admin || admin.instituteId !== userToApprove.instituteId) {
    throw new ForbiddenError('Cannot approve users outside your institute.');
  }

  await prisma.user.update({
    where: { id: id as string },
    data: { isApproved: true }
  });

  await logActivity(req.user.id, `Approved application for ${userToApprove.firstName}`, 'User', id as string);

  res.json({ message: 'Application approved successfully' });
});

// ─── REJECT APPLICATION ─────────────────────────────────────────────────────
export const rejectApplication = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const userToReject = await prisma.user.findUnique({
    where: { id: id as string },
    select: { instituteId: true, firstName: true }
  });

  if (!userToReject) {
    throw new NotFoundError('User not found');
  }

  const admin = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { instituteId: true }
  });

  if (!admin || admin.instituteId !== userToReject.instituteId) {
    throw new ForbiddenError('Cannot reject users outside your institute.');
  }

  await prisma.student.deleteMany({
    where: { userId: id as string }
  });

  await prisma.user.delete({
    where: { id: id as string }
  });

  await logActivity(req.user.id, `Rejected application for ${userToReject.firstName}`, 'User', id as string);

  res.json({ message: 'Application rejected successfully' });
});
