import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { logActivity } from '../utils/auditLogger';

export const getInstitutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Access denied. Super Admin only.' });
      return;
    }

    const institutes = await prisma.institute.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        _count: {
          select: { courses: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ institutes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInstitute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const { name, address, phone, email, website } = req.body;

    const institute = await prisma.institute.create({
      data: { name, address, phone, email, website }
    });

    await logActivity(req.user.id, `Created Institute: ${name}`, 'Institute', institute.id);

    res.status(201).json({ message: 'Institute created successfully', institute });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInstitute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const { id } = req.params;
    const { name, address, phone, email, website } = req.body;

    const institute = await prisma.institute.update({
      where: { id: id as string },
      data: { name, address, phone, email, website }
    });

    await logActivity(req.user.id, `Updated Institute: ${name}`, 'Institute', institute.id);

    res.json({ message: 'Institute updated successfully', institute });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update institute' });
  }
};

export const deleteInstitute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    const { id } = req.params;

    // Check if there are dependent courses or users
    const coursesCount = await prisma.course.count({ where: { instituteId: id as string } });
    if (coursesCount > 0) {
      res.status(400).json({ message: 'Cannot delete institute because it has associated courses.' });
      return;
    }

    const usersCount = await prisma.user.count({ where: { instituteId: id as string } });
    if (usersCount > 0) {
      res.status(400).json({ message: 'Cannot delete institute because it has associated users. Delete them first.' });
      return;
    }

    await prisma.institute.delete({ where: { id: id as string } });
    await logActivity(req.user.id, `Deleted Institute ID: ${id}`, 'Institute', id as string);

    res.json({ message: 'Institute deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete institute' });
  }
};
