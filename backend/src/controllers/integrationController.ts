import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getIntegrations = async (req: AuthRequest, res: Response) => {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: { provider: 'asc' }
    });
    res.json({ integrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
};

export const updateIntegration = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ message: 'Failed to update integration' });
  }
};

export const seedIntegrations = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Seed integrations error:', error);
    res.status(500).json({ message: 'Failed to seed integrations' });
  }
};
