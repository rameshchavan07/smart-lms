import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { logActivity } from '../utils/auditLogger';
import { getOrCreateFolderId } from '../services/googleDriveService';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';
import { generateUniqueSlug } from '../utils/slugify';
import { InstituteStatus } from '@prisma/client';
import {
  sendInstituteApprovalEmail,
  sendInstituteRejectionEmail,
  sendInstituteSuspensionEmail,
  sendInstituteReactivationEmail,
} from '../services/instituteEmailService';
import { getCache, setCache, invalidateCacheByPattern } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';


// ─── GET ALL INSTITUTES (Super Admin, with status filter) ────────────────────
export const getInstitutes = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied. Super Admin only.');
  }

  const status = req.query.status as InstituteStatus | undefined;
  const whereClause = status ? { status } : {};

  const institutes = await prisma.institute.findMany({
    where: whereClause,
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

// ─── GET INSTITUTE BY ID (Super Admin) ──────────────────────────────────────
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

// ─── GET INSTITUTE BY SLUG (Public) ─────────────────────────────────────────
export const getInstituteBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const cacheKey = CACHE_KEYS.INSTITUTE_SLUG(slug as string);

  const cached = await getCache<object>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const institute = await prisma.institute.findUnique({
    where: { slug: slug as string },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      status: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      themeColor: true,
      coverImageUrl: true,
      description: true,
      allowedEmailDomain: true,
      isPrivate: true,
      facebookUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      supportEmail: true,
      supportPhone: true,
      themeConfig: true,
      terminologyMap: true,
      legalPages: true,
    }
  });

  if (!institute) {
    throw new NotFoundError('Institute not found');
  }

  const responseData = { institute };
  await setCache(cacheKey, responseData, CACHE_TTL.INSTITUTE_SLUG);

  res.json(responseData);
});

// ─── CREATE INSTITUTE (Super Admin — auto-approved) ─────────────────────────
export const createInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { name, address, phone, email, website } = req.body;
  const slug = await generateUniqueSlug(name);

  const institute = await prisma.institute.create({
    data: {
      name,
      slug,
      address,
      phone,
      email,
      website,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id,
    }
  });

  // Automatically create Google Drive folder for the institute
  try {
    await getOrCreateFolderId([
      { path: 'institutes', name: 'Institutes' },
      { path: `institutes/${institute.id}`, name: institute.name }
    ]);
  } catch (err) {
    console.error(`Failed to create Google Drive folder for institute ${name}:`, err instanceof Error ? err.message : String(err));
    // We don't fail the whole request just because Drive folder creation failed
  }

  await logActivity(req.user.id, `Created Institute: ${name}`, 'Institute', institute.id);

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.status(201).json({ message: 'Institute created successfully', institute });
});

// ─── UPDATE INSTITUTE (Super Admin) ──────────────────────────────────────────
export const updateInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;
  const { 
    name, address, phone, email, website, 
    themeColor, coverImageUrl, description, 
    allowedEmailDomain, isPrivate, 
    facebookUrl, linkedinUrl, twitterUrl, 
    supportEmail, supportPhone,
    themeConfig, terminologyMap, legalPages
  } = req.body;

  const institute = await prisma.institute.update({
    where: { id: id as string },
    data: { 
      name, address, phone, email, website,
      themeColor, coverImageUrl, description,
      allowedEmailDomain, isPrivate,
      facebookUrl, linkedinUrl, twitterUrl,
      supportEmail, supportPhone,
      themeConfig, terminologyMap, legalPages
    }
  });

  await logActivity(req.user.id, `Updated Institute: ${name}`, 'Institute', institute.id);

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute updated successfully', institute });
});

// ─── APPROVE INSTITUTE (Super Admin) ─────────────────────────────────────────
export const approveInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: {
      users: {
        where: { role: 'ADMIN' },
        select: { email: true, firstName: true }
      }
    }
  });

  if (!institute) throw new NotFoundError('Institute not found');

  if (institute.status !== 'PENDING') {
    throw new ValidationError(`Cannot approve an institute with status: ${institute.status}. Only PENDING institutes can be approved.`);
  }

  await prisma.institute.update({
    where: { id: id as string },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id,
      rejectionReason: null,
    }
  });

  await logActivity(req.user.id, `Approved Institute: ${institute.name}`, 'Institute', institute.id);

  // Notify the institute admin
  for (const admin of institute.users) {
    sendInstituteApprovalEmail(admin.email, admin.firstName, institute.name, institute.slug).catch(console.error);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute approved successfully' });
});

// ─── REJECT INSTITUTE (Super Admin) ──────────────────────────────────────────
export const rejectInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    throw new ValidationError('A rejection reason is required.');
  }

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: {
      users: {
        where: { role: 'ADMIN' },
        select: { email: true, firstName: true }
      }
    }
  });

  if (!institute) throw new NotFoundError('Institute not found');

  if (institute.status !== 'PENDING') {
    throw new ValidationError(`Cannot reject an institute with status: ${institute.status}. Only PENDING institutes can be rejected.`);
  }

  await prisma.institute.update({
    where: { id: id as string },
    data: {
      status: 'REJECTED',
      rejectionReason: reason.trim(),
    }
  });

  await logActivity(req.user.id, `Rejected Institute: ${institute.name} — Reason: ${reason.trim()}`, 'Institute', institute.id);

  // Notify the institute admin
  for (const admin of institute.users) {
    sendInstituteRejectionEmail(admin.email, admin.firstName, institute.name, reason.trim()).catch(console.error);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute rejected' });
});

// ─── SUSPEND INSTITUTE (Super Admin) ─────────────────────────────────────────
export const suspendInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: {
      users: {
        where: { role: 'ADMIN' },
        select: { email: true, firstName: true }
      }
    }
  });

  if (!institute) throw new NotFoundError('Institute not found');

  if (institute.status !== 'APPROVED') {
    throw new ValidationError(`Cannot suspend an institute with status: ${institute.status}. Only APPROVED institutes can be suspended.`);
  }

  await prisma.institute.update({
    where: { id: id as string },
    data: { status: 'SUSPENDED' }
  });

  await logActivity(req.user.id, `Suspended Institute: ${institute.name}`, 'Institute', institute.id);

  // Notify the institute admin
  for (const admin of institute.users) {
    sendInstituteSuspensionEmail(admin.email, admin.firstName, institute.name).catch(console.error);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute suspended' });
});

// ─── REACTIVATE INSTITUTE (Super Admin) ──────────────────────────────────────
export const reactivateInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: {
      users: {
        where: { role: 'ADMIN' },
        select: { email: true, firstName: true }
      }
    }
  });

  if (!institute) throw new NotFoundError('Institute not found');

  if (institute.status !== 'SUSPENDED') {
    throw new ValidationError(`Cannot reactivate an institute with status: ${institute.status}. Only SUSPENDED institutes can be reactivated.`);
  }

  await prisma.institute.update({
    where: { id: id as string },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id,
    }
  });

  await logActivity(req.user.id, `Reactivated Institute: ${institute.name}`, 'Institute', institute.id);

  // Notify the institute admin
  for (const admin of institute.users) {
    sendInstituteReactivationEmail(admin.email, admin.firstName, institute.name, institute.slug).catch(console.error);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute reactivated successfully' });
});

// ─── DELETE INSTITUTE (Super Admin) ──────────────────────────────────────────
export const deleteInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied.');
  }

  const { id } = req.params;

  const institute = await prisma.institute.findUnique({
    where: { id: id as string },
    include: { _count: { select: { courses: true, users: true } } }
  });

  if (!institute) throw new NotFoundError('Institute not found');

  // Soft delete all courses, users, and the institute
  // The Prisma Client Extension will intercept these and set deletedAt = new Date()
  await prisma.$transaction([
    prisma.course.deleteMany({ where: { instituteId: id as string } }),
    prisma.user.deleteMany({ where: { instituteId: id as string } }),
    prisma.institute.delete({ where: { id: id as string } }),
  ]);

  await logActivity(req.user.id, `Deleted Institute: ${institute.name} (${institute._count.users} users, ${institute._count.courses} courses)`, 'Institute', id as string);

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ message: 'Institute and all associated data deleted successfully' });
});

// ─── GET MY INSTITUTE SETTINGS (Admin) ──────────────────────────────────────
export const getMyInstitute = catchAsync(async (req: AuthRequest, res: Response) => {
  const instituteId = req.user?.instituteId;
  if (!instituteId) {
    throw new ForbiddenError('You are not associated with any institute.');
  }

  const institute = await prisma.institute.findUnique({
    where: { id: instituteId },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      status: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      themeColor: true,
      coverImageUrl: true,
      description: true,
      allowedEmailDomain: true,
      isPrivate: true,
      facebookUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      supportEmail: true,
      supportPhone: true,
      themeConfig: true,
      terminologyMap: true,
      legalPages: true,
    }
  });

  if (!institute) {
    throw new NotFoundError('Institute not found');
  }

  res.json({ institute });
});

// ─── UPDATE MY INSTITUTE SETTINGS (Admin) ───────────────────────────────────
export const updateMyInstituteSettings = catchAsync(async (req: AuthRequest, res: Response) => {
  const instituteId = req.user?.instituteId;
  if (!instituteId) {
    throw new ForbiddenError('You are not associated with any institute.');
  }

  const {
    themeColor,
    coverImageUrl,
    description,
    allowedEmailDomain,
    isPrivate,
    facebookUrl,
    linkedinUrl,
    twitterUrl,
    supportEmail,
    supportPhone,
    themeConfig,
    terminologyMap,
    legalPages,
  } = req.body;

  const institute = await prisma.institute.update({
    where: { id: instituteId },
    data: {
      themeColor,
      coverImageUrl,
      description,
      allowedEmailDomain,
      isPrivate,
      facebookUrl,
      linkedinUrl,
      twitterUrl,
      supportEmail,
      supportPhone,
      themeConfig,
      terminologyMap,
      legalPages,
    },
  });

  if (req.user?.id) {
    await logActivity(req.user.id, `Updated Institute Settings`, 'Institute', instituteId);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ institute });
});

// ─── UPLOAD MY INSTITUTE LOGO (Admin) ───────────────────────────────────────
export const uploadMyInstituteLogo = catchAsync(async (req: AuthRequest, res: Response) => {
  const instituteId = req.user?.instituteId;
  if (!instituteId) {
    throw new ForbiddenError('You are not associated with any institute.');
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const logoUrl = req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;

  const institute = await prisma.institute.update({
    where: { id: instituteId },
    data: { logoUrl },
  });

  if (req.user?.id) {
    await logActivity(req.user.id, `Updated Institute Logo`, 'Institute', instituteId);
  }

    await invalidateCacheByPattern(CACHE_KEYS.INSTITUTE_PATTERN);
res.json({ logoUrl, message: 'Logo updated successfully' });
});

// ─── GET SUPER ADMIN DASHBOARD STATS ──────────────────────────────────────────────
export const getSuperAdminStats = catchAsync(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Access denied. Super Admin only.');
  }

  const [pending, approved, suspended, rejected, totalUsers, recentInstitutes] = await Promise.all([
    prisma.institute.count({ where: { status: 'PENDING' } }),
    prisma.institute.count({ where: { status: 'APPROVED' } }),
    prisma.institute.count({ where: { status: 'SUSPENDED' } }),
    prisma.institute.count({ where: { status: 'REJECTED' } }),
    prisma.user.count(),
    prisma.institute.findMany({
      where: { status: 'PENDING' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    stats: { pending, approved, suspended, rejected, totalUsers, total: pending + approved + suspended + rejected },
    recentPending: recentInstitutes,
  });
});
