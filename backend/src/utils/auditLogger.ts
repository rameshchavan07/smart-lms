import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logActivity = async (userId: string, action: string, entityType: string, entityId: string): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
