import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadFileToDrive, deleteFileFromDrive, getOrCreateFolderId } from '../services/googleDriveService';
import fs from 'fs';
import { logActivity } from '../utils/auditLogger';
import { createNotification } from '../services/notificationService';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../utils/AppError';
import { getCache, setCache, invalidateCache } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

import prisma from '../config/db';

// Upload study material (Teacher only)
export const uploadMaterial = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;
  const { title, description } = req.body;

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  try {
    // Verify course exists and belongs to this teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id },
      include: { user: true }
    });

    if (!teacher) {
      throw new ForbiddenError('Only teachers can upload study materials');
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: teacher.id },
      include: { institute: { select: { name: true } } }
    });

    if (!course) {
      throw new NotFoundError('Course not found or you are not assigned to it');
    }

    // Resolve Google Drive target folder: Institutes/[Institute]/Courses/[Course]/Teachers/[Teacher]/Documents
    const instName = course.institute?.name || 'Global';
    const instId = course.instituteId || 'global';
    const courseName = course.title;
    const cId = course.id;
    const teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;

    const pathComponents = [
      { path: 'institutes', name: 'Institutes' },
      { path: `institutes/${instId}`, name: instName },
      { path: `institutes/${instId}/courses`, name: 'Courses' },
      { path: `institutes/${instId}/courses/${cId}`, name: courseName },
      { path: `institutes/${instId}/courses/${cId}/Teachers`, name: 'Teachers' },
      { path: `institutes/${instId}/courses/${cId}/Teachers/${teacher.id}`, name: teacherName },
      { path: `institutes/${instId}/courses/${cId}/Teachers/${teacher.id}/Documents`, name: 'Documents' },
    ];

    const targetFolderId = await getOrCreateFolderId(pathComponents);

    // Upload to Google Drive
    const result = await uploadFileToDrive(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      targetFolderId
    );

    // Save to GoogleDriveFile table first (tracks drive storage usage)
    await prisma.googleDriveFile.create({
      data: {
        driveFileId: result.fileId || '',
        fileName: req.file.originalname,
        fileUrl: result.webViewLink || '',
        uploadedBy: req.user!.id,
      }
    });

    // Save to StudyMaterial table
    const studyMaterial = await prisma.studyMaterial.create({
      data: {
        courseId,
        title: title || req.file.originalname,
        description: description || null,
        fileUrl: result.webViewLink || '',
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user!.id
      }
    });

    await logActivity(req.user!.id, `Uploaded study material: ${studyMaterial.title} for course: ${course?.title || courseId}`, 'StudyMaterial', studyMaterial.id);

    // Cleanup temp file after successful upload
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    // Invalidate the course materials cache
    await invalidateCache(CACHE_KEYS.COURSE_MATERIALS(courseId));

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { select: { userId: true } } }
    });

    await Promise.all(
      enrollments.map(e =>
        createNotification(
          e.student.userId,
          'New Study Material Uploaded',
          `New study material "${studyMaterial.title}" has been uploaded for course "${course.title}".`
        ).catch(err => console.error('Study material notification error:', err))
      )
    );

    res.status(201).json({
      message: 'Study material uploaded successfully',
      studyMaterial
    });

  } catch (error: unknown) {
    // Cleanup temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    throw error;
  }
});

// Get study materials for a course (Student & Teacher)
export const getCourseMaterials = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;

  // Verify course access
  if (req.user!.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });
    if (!student) {
      throw new ForbiddenError('Student record not found');
    }
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } }
    });
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course');
    }
  } else if (req.user!.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });
    if (!teacher) {
      throw new ForbiddenError('Teacher record not found');
    }
    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: teacher.id }
    });
    if (!course) {
      throw new ForbiddenError('You are not assigned to this course');
    }
  }

  const cacheKey = CACHE_KEYS.COURSE_MATERIALS(courseId);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const materials = await prisma.studyMaterial.findMany({
    where: { courseId },
    orderBy: { uploadedAt: 'desc' }
  });

  const payload = { materials };
  await setCache(cacheKey, payload, CACHE_TTL.COURSE_MATERIALS);
  res.json(payload);
});

// Delete study material (Teacher only)
export const deleteMaterial = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const studyMaterial = await prisma.studyMaterial.findUnique({
    where: { id }
  });

  if (!studyMaterial) {
    throw new NotFoundError('Study material not found');
  }

  // Verify user is teacher assigned to the course
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user!.id }
  });

  if (!teacher && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('Access denied');
  }

  if (req.user!.role !== 'ADMIN') {
    const course = await prisma.course.findFirst({
      where: { id: studyMaterial.courseId, teacherId: teacher!.id }
    });

    if (!course) {
      throw new ForbiddenError('You cannot delete materials from a course you do not teach');
    }
  }

  // Find and delete from Google Drive
  const driveFile = await prisma.googleDriveFile.findFirst({
    where: { fileUrl: studyMaterial.fileUrl }
  });

  if (driveFile) {
    await deleteFileFromDrive(driveFile.driveFileId);
    await prisma.googleDriveFile.delete({
      where: { id: driveFile.id }
    });
  }

  // Delete from DB
  await prisma.studyMaterial.delete({
    where: { id }
  });

  await logActivity(req.user!.id, `Deleted study material: ${studyMaterial.title}`, 'StudyMaterial', id);

  // Invalidate the course materials cache
  await invalidateCache(CACHE_KEYS.COURSE_MATERIALS(studyMaterial.courseId));

  res.json({ message: 'Study material deleted successfully' });
});
