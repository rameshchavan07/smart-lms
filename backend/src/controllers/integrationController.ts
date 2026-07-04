import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getIntegrations = catchAsync(async (req: AuthRequest, res: Response) => {
  const integrations = await prisma.integration.findMany({
    orderBy: { provider: 'asc' }
  });
  res.json({ integrations });
});

export const updateIntegration = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive, apiKey, apiSecret, config } = req.body;

  const integration = await prisma.integration.update({
    where: { id: id as string },
    data: {
      isActive,
      apiKey,
      apiSecret,
      config
    }
  });

  res.json({ message: 'Integration updated', integration });
});

export const seedIntegrations = catchAsync(async (req: AuthRequest, res: Response) => {
  const providers = ['Zoom', 'GoogleDrive', 'Stripe', 'Slack', 'GitHub'];
  for (const provider of providers) {
    await prisma.integration.upsert({
      where: { provider },
      update: {},
      create: { provider, isActive: false }
    });
  }
  const integrations = await prisma.integration.findMany();
  res.json({ message: 'Integrations seeded', integrations });
});
