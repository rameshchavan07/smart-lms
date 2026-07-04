import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/auditLogger';
import { catchAsync } from '../utils/catchAsync';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';

import prisma from '../config/db';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  TEACHER: 2,
  STUDENT: 1
};

const canModifyUser = (currentUserRole: string, targetUserRole: string): boolean => {
  if (currentUserRole === 'SUPER_ADMIN') return true;
  return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole];
};

// Get all users with pagination and filtering
export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
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
});

// Create a Teacher
export const createTeacher = catchAsync(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, password, employeeCode, specialization, qualification } = req.body;

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    throw new ValidationError('User already exists');
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
          employeeCode: employeeCode || `EMP-${Date.now()}`,
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
});

// Create an Admin
export const createAdmin = catchAsync(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, password, phoneNumber, address, instituteId, role } = req.body;

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    throw new ValidationError('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const requestedRole = role === 'SUPER_ADMIN' && req.user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      phoneNumber,
      address,
      role: requestedRole,
      instituteId,
    }
  });

  await logActivity(req.user!.id, `Created Admin profile: ${firstName} ${lastName}`, 'User', user.id);

  res.status(201).json({ message: 'Admin created successfully', user });
});

// Create a Student
export const createStudent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, password, enrollmentNumber, academicYear, phoneNumber, address } = req.body;

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    throw new ValidationError('User already exists');
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
      student: {
        create: {
          enrollmentNumber: enrollmentNumber || `ENR-${Date.now()}`,
          academicYear: academicYear || new Date().getFullYear().toString(),
          admissionDate: new Date()
        }
      }
    },
    include: { student: true }
  });

  await logActivity(req.user!.id, `Created Student profile: ${firstName} ${lastName}`, 'User', user.id);

  res.status(201).json({ message: 'Student created successfully', user });
});

// Update User Status (Deactivate/Activate)
export const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const targetUser = await prisma.user.findUnique({ where: { id: id as string } });
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user!.role, targetUser.role) && req.user!.id !== id) {
    throw new ForbiddenError('Permission denied: Cannot modify users with equal or higher roles.');
  }

  const user = await prisma.user.update({
    where: { id: id as string },
    data: { isActive },
    select: { id: true, email: true, isActive: true }
  });

  await logActivity(req.user!.id, `${isActive ? 'Activated' : 'Deactivated'} user account: ${user.email}`, 'User', user.id);

  res.json({ message: 'User status updated', user });
});

export const updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, phoneNumber, address, instituteId, ...profileData } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: id as string },
    include: { student: true, teacher: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user!.role, user.role) && req.user!.id !== id) {
    throw new ForbiddenError('Permission denied: Cannot modify users with equal or higher roles.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: id as string },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        role,
        ...(instituteId !== undefined && { instituteId: instituteId === '' ? null : instituteId })
      }
    });

    if (role === 'STUDENT') {
      await tx.student.upsert({
        where: { userId: user.id },
        update: {
          enrollmentNumber: profileData.enrollmentNumber || user.student?.enrollmentNumber,
          academicYear: profileData.academicYear || user.student?.academicYear
        },
        create: {
          userId: user.id,
          enrollmentNumber: profileData.enrollmentNumber || `ENR-${Date.now()}`,
          academicYear: profileData.academicYear || new Date().getFullYear().toString(),
          admissionDate: new Date()
        }
      });
    } else if (role === 'TEACHER') {
      await tx.teacher.upsert({
        where: { userId: user.id },
        update: {
          employeeCode: profileData.employeeCode || user.teacher?.employeeCode,
          specialization: profileData.specialization || user.teacher?.specialization,
          qualification: profileData.qualification || user.teacher?.qualification
        },
        create: {
          userId: user.id,
          employeeCode: profileData.employeeCode || `EMP-${Date.now()}`,
          specialization: profileData.specialization || '',
          qualification: profileData.qualification || '',
          joiningDate: new Date()
        }
      });
    }
  });

  await logActivity(req.user!.id, `Updated profile details for user: ${email}`, 'User', id as string);

  res.json({ message: 'User updated successfully' });
});

export const deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: id as string },
    include: { student: true, teacher: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!canModifyUser(req.user!.role, user.role)) {
    throw new ForbiddenError('Permission denied: Cannot delete users with equal or higher roles.');
  }

  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { userId: id as string } }),
    prisma.notification.deleteMany({ where: { userId: id as string } }),
    prisma.googleDriveFile.deleteMany({ where: { uploadedBy: id as string } }),
    prisma.discussionReply.deleteMany({ where: { userId: id as string } }),
    prisma.discussion.deleteMany({ where: { userId: id as string } }),
    prisma.message.deleteMany({ 
      where: { 
        OR: [
          { senderId: id as string },
          { receiverId: id as string }
        ]
      } 
    }),
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
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { firstName, lastName, password } = req.body;
  const updateData: any = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });
  res.json({ message: 'Profile updated', user });
});

export const uploadAvatar = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }
  
  const userId = req.user!.id;
  const fileUrl = `/uploads/${req.file.filename}`;
  
  await prisma.user.update({
    where: { id: userId },
    data: { profileImage: fileUrl }
  });
  
  res.json({ message: 'Avatar updated successfully', profileImage: fileUrl });
});
