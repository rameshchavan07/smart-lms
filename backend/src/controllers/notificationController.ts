import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { getVapidPublicKey as getPublicKey, saveSubscription } from '../services/notifications.service';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError } from '../utils/AppError';

export const getMyNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ notifications });
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({ message: 'Notification marked as read', notification: updated });
});

export const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ message: 'All notifications marked as read' });
});

export const deleteNotification = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  await prisma.notification.delete({
    where: { id },
  });

  res.json({ message: 'Notification deleted successfully' });
});

export const getVapidPublicKey = (req: AuthRequest, res: Response) => {
  res.send(getPublicKey());
};

export const subscribeToPush = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const subscription = req.body;
  await saveSubscription(userId, subscription);
  res.status(201).json({ message: 'Subscription saved successfully.' });
});
