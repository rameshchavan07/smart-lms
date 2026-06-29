import prisma from '../config/db';
import { getIO } from '../utils/socket';

export const createNotification = async (userId: string, title: string, message: string) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    try {
      const io = getIO();
      io.to(userId).emit('new_notification', notification);
    } catch (socketError) {
      console.error(`Socket broadcast failed for user ${userId}:`, socketError);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};
