import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { getOrCreateFolderId, uploadFileToDrive, deleteFileFromDrive } from '../services/googleDriveService';
import { logActivity } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Get all courses with pagination and optional search
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } }
        },
        _count: { select: { enrollments: true, lectures: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.course.count({ where: whereClause });

    res.json({
      courses,
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

// Create a new course (Admin)
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, teacherId } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId: teacherId || null,
      },
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    await logActivity(req.user!.id, `Created course: ${title}`, 'Course', course.id);

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update a course (Admin)
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, teacherId } = req.body;

    const course = await prisma.course.update({
      where: { id: id as string },
      data: {
        title,
        description,
        teacherId: teacherId || null,
      },
    });

    await logActivity(req.user!.id, `Updated course details: ${title}`, 'Course', course.id);

    res.json({ message: 'Course updated successfully', course });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update course' });
  }
};

// Delete a course (Admin)
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id: id as string },
    });

    await logActivity(req.user!.id, `Deleted course ID: ${id}`, 'Course', id as string);

    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
};

// Get Teacher's assigned courses
export const getTeacherCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'TEACHER') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id }
    });

    if (!teacher) {
      res.status(404).json({ message: 'Teacher record not found' });
      return;
    }

    const courses = await prisma.course.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: { select: { enrollments: true, lectures: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to parse file ID from Google Drive URL
const extractFileIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const uploadCourseThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const course = await prisma.course.findUnique({
      where: { id: id as string }
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return;
    }

    // Resolve or create Google Drive folder structure: courses/thumbnails
    const folderId = await getOrCreateFolderId([
      { path: 'courses', name: 'Courses' },
      { path: 'courses/thumbnails', name: 'Course Thumbnails' }
    ]);

    // Upload thumbnail file to Drive
    const uploadResult = await uploadFileToDrive(
      req.file.path,
      `thumbnail-${course.id}-${Date.now()}${path.extname(req.file.originalname)}`,
      req.file.mimetype,
      folderId
    );

    // If there is an existing thumbnail, delete it from Drive
    if (course.thumbnailUrl) {
      const oldFileId = extractFileIdFromUrl(course.thumbnailUrl);
      if (oldFileId) {
        await deleteFileFromDrive(oldFileId);
      }
    }

    // Update database
    const updatedCourse = await prisma.course.update({
      where: { id: id as string },
      data: { thumbnailUrl: `https://drive.google.com/thumbnail?id=${uploadResult.fileId}&sz=w800` }
    });

    await logActivity(req.user!.id, `Uploaded course thumbnail for: ${course.title}`, 'Course', course.id);

    // Remove local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ message: 'Course thumbnail uploaded successfully', course: updatedCourse });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload thumbnail: ' + error.message });
  }
};
