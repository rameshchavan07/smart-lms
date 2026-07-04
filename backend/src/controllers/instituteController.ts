import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { logActivity } from '../utils/auditLogger';
import { getOrCreateFolderId } from '../services/googleDriveService';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';

export const getInstitutes = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied. Super Admin only.');
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
});

export const getInstituteById = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied. Super Admin only.');
  }

  const { id } = req.params;

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          teacher: { select: { employeeCode: true, specialization: true } },
          student: { select: { enrollmentNumber: true, academicYear: true } }
        }
      },
      courses: {
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { enrollments: true, lectures: true } }
        }
      },
      _count: {
        select: { courses: true, users: true }
      }
    }
  });

  if (!institute) {
    throw new NotFoundError('Institute not found');
  }

  res.json({ institute });
});

export const createInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { name, address, phone, email, website } = req.body;

  const institute = await prisma.institute.create({
    data: { name, address, phone, email, website }
  });

  // Automatically create Google Drive folder for the institute
  try {
    await getOrCreateFolderId([
      { path: 'institutes', name: 'Institutes' },
      { path: `institutes/${institute.id}`, name: institute.name }
    ]);
  } catch (err: any) {
    console.error(`Failed to create Google Drive folder for institute ${name}:`, err.message);
    // We don't fail the whole request just because Drive folder creation failed
  }

  await logActivity(req.user.id, `Created Institute: ${name}`, 'Institute', institute.id);

  res.status(201).json({ message: 'Institute created successfully', institute });
});

export const updateInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;
  const { name, address, phone, email, website } = req.body;

  const institute = await prisma.institute.update({
    where: { id: id as string },
    data: { name, address, phone, email, website }
  });

  await logActivity(req.user.id, `Updated Institute: ${name}`, 'Institute', institute.id);

  res.json({ message: 'Institute updated successfully', institute });
});

export const deleteInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  // Check if there are dependent courses or users
  const coursesCount = await prisma.course.count({ where: { instituteId: id as string } });
  if (coursesCount > 0) {
    throw new ValidationError('Cannot delete institute because it has associated courses.');
  }

  const usersCount = await prisma.user.count({ where: { instituteId: id as string } });
  if (usersCount > 0) {
    throw new ValidationError('Cannot delete institute because it has associated users. Delete them first.');
  }

  await prisma.institute.delete({ where: { id: id as string } });
  await logActivity(req.user.id, `Deleted Institute ID: ${id}`, 'Institute', id as string);

  res.json({ message: 'Institute deleted successfully' });
});
