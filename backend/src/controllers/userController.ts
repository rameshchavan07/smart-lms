import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Get all users with pagination and filtering
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        teacher: { select: { id: true, employeeCode: true, specialization: true } },
        student: { select: { id: true, enrollmentNumber: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Teacher
export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, employeeCode, specialization, qualification } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeCode,
            specialization,
            qualification,
            joiningDate: new Date()
          }
        }
      },
      include: { teacher: true }
    });

    await logActivity(req.user!.id, `Created Teacher profile: ${firstName} ${lastName}`, 'User', user.id);

    res.status(201).json({ message: 'Teacher created successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Student
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, enrollmentNumber, academicYear } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            enrollmentNumber,
            academicYear,
            admissionDate: new Date()
          }
        }
      },
      include: { student: true }
    });

    await logActivity(req.user!.id, `Created Student profile: ${firstName} ${lastName}`, 'User', user.id);

    res.status(201).json({ message: 'Student created successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Status (Deactivate/Activate)
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    await logActivity(req.user!.id, `${isActive ? 'Activated' : 'Deactivated'} user account: ${user.email}`, 'User', user.id);

    res.json({ message: 'User status updated', user });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, ...profileData } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
      include: { student: true, teacher: true }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: id as string },
        data: {
          firstName,
          lastName,
          email,
          role
        }
      });

      if (user.role === 'STUDENT' && user.student) {
        await tx.student.update({
          where: { id: user.student.id },
          data: {
            enrollmentNumber: profileData.enrollmentNumber || user.student.enrollmentNumber,
            academicYear: profileData.academicYear || user.student.academicYear
          }
        });
      } else if (user.role === 'TEACHER' && user.teacher) {
        await tx.teacher.update({
          where: { id: user.teacher.id },
          data: {
            employeeCode: profileData.employeeCode || user.teacher.employeeCode,
            specialization: profileData.specialization || user.teacher.specialization,
            qualification: profileData.qualification || user.teacher.qualification
          }
        });
      }
    });

    await logActivity(req.user!.id, `Updated profile details for user: ${email}`, 'User', id as string);

    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update user: ' + error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
      include: { student: true, teacher: true }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { userId: id as string } }),
      prisma.notification.deleteMany({ where: { userId: id as string } }),
      prisma.googleDriveFile.deleteMany({ where: { uploadedBy: id as string } }),
      ...(user.student ? [
        prisma.attendance.deleteMany({ where: { studentId: user.student.id } }),
        prisma.assignmentSubmission.deleteMany({ where: { studentId: user.student.id } }),
        prisma.enrollment.deleteMany({ where: { studentId: user.student.id } }),
        prisma.student.delete({ where: { id: user.student.id } })
      ] : []),
      ...(user.teacher ? [
        prisma.course.updateMany({ where: { teacherId: user.teacher.id }, data: { teacherId: null } }),
        prisma.teacher.delete({ where: { id: user.teacher.id } })
      ] : []),
      prisma.refreshToken.deleteMany({ where: { userId: id as string } }),
      prisma.user.delete({ where: { id: id as string } })
    ]);

    await logActivity(req.user!.id, `Deleted user profile: ${user.email}`, 'User', id as string);

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete user: ' + error.message });
  }
};
