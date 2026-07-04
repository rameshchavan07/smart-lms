import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { getOrCreateFolderId, uploadFileToDrive, deleteFileFromDrive } from '../services/googleDriveService';
import { logActivity } from '../utils/auditLogger';

import prisma from '../config/db';

// Get all courses with pagination and optional search
export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
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

    if (req.user && req.user.role !== 'SUPER_ADMIN') {
      whereClause.instituteId = req.user.instituteId;
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
        instituteId: req.body.instituteId || req.user?.instituteId || null,
      },
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        institute: { select: { name: true } }
      }
    });

    // Automatically create Google Drive folder structure for the course
    try {
      const instName = course.institute?.name || 'Global';
      const instId = course.instituteId || 'global';
      const courseName = course.title;
      const cId = course.id;

      // Ensure Institute folder exists
      await getOrCreateFolderId([
        { path: 'institutes', name: 'Institutes' },
        { path: `institutes/${instId}`, name: instName }
      ]);

      // Create base course folder and subfolders
      const subFolders = ['Thumbnails', 'Videos', 'Teachers', 'Students'];
      for (const sub of subFolders) {
        await getOrCreateFolderId([
          { path: 'institutes', name: 'Institutes' },
          { path: `institutes/${instId}`, name: instName },
          { path: `institutes/${instId}/courses`, name: 'Courses' },
          { path: `institutes/${instId}/courses/${cId}`, name: courseName },
          { path: `institutes/${instId}/courses/${cId}/${sub}`, name: sub }
        ]);
      }
    } catch (err: any) {
      console.error(`Failed to create Google Drive folder for course ${title}:`, err.message);
    }

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

    const courseId = id as string;

    // Fetch related IDs for nested deletion
    const lectures = await prisma.lecture.findMany({ where: { courseId }, select: { id: true } });
    const lectureIds = lectures.map(l => l.id);

    const assignments = await prisma.assignment.findMany({ where: { courseId }, select: { id: true } });
    const assignmentIds = assignments.map(a => a.id);

    await prisma.$transaction([
      // Delete grandchild records
      prisma.attendance.deleteMany({ where: { lectureId: { in: lectureIds } } }),
      prisma.assignmentSubmission.deleteMany({ where: { assignmentId: { in: assignmentIds } } }),
      
      // Delete child records without cascade
      prisma.studyMaterial.deleteMany({ where: { courseId } }),
      prisma.enrollment.deleteMany({ where: { courseId } }),
      prisma.lecture.deleteMany({ where: { courseId } }),
      prisma.assignment.deleteMany({ where: { courseId } }),
      
      // Finally delete the course
      prisma.course.delete({ where: { id: courseId } })
    ]);

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
      where: { id: id as string },
      include: { institute: { select: { name: true } } }
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return;
    }

    const instName = course.institute?.name || 'Global';
    const instId = course.instituteId || 'global';
    const courseName = course.title;
    const cId = course.id;

    // Resolve or create Google Drive folder structure: Institutes/[Institute]/Courses/[Course]/Thumbnails
    const folderId = await getOrCreateFolderId([
      { path: 'institutes', name: 'Institutes' },
      { path: `institutes/${instId}`, name: instName },
      { path: `institutes/${instId}/courses`, name: 'Courses' },
      { path: `institutes/${instId}/courses/${cId}`, name: courseName },
      { path: `institutes/${instId}/courses/${cId}/Thumbnails`, name: 'Thumbnails' }
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
