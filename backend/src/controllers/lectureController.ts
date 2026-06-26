import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { generateJitsiToken } from '../services/jitsi.service';
import { logActivity } from '../utils/auditLogger';
import path from 'path';
import fs from 'fs';
import { getOrCreateFolderId, uploadFileToDrive, deleteFileFromDrive } from '../services/googleDriveService';

const prisma = new PrismaClient();

// Create a new lecture (Teacher only)
export const createLecture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const { title, description, startTime, endTime } = req.body;

    // Verify course belongs to this teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher) {
      res.status(403).json({ message: 'Only teachers can create lectures' });
      return;
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: teacher.id }
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found or you are not assigned to it' });
      return;
    }

    // Generate unique Jitsi meeting ID
    const meetingId = `smart-lms-${uuidv4()}`;

    const lecture = await prisma.lecture.create({
      data: {
        title,
        description,
        courseId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingUrl: meetingId,
        createdBy: req.user!.id,
      }
    });

    await logActivity(req.user!.id, `Scheduled lecture: ${title} for course: ${course.title}`, 'Lecture', lecture.id);

    res.status(201).json({ message: 'Lecture scheduled successfully', lecture });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all lectures for a course
export const getCourseLectures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;

    // Verify access
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (student) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: student.id, courseId } }
        });
        if (!enrollment) {
          res.status(403).json({ message: 'You are not enrolled in this course' });
          return;
        }
      }
    }

    const lectures = await prisma.lecture.findMany({
      where: { courseId },
      orderBy: { startTime: 'asc' }
    });

    res.json({ lectures });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Join a lecture (record attendance logic later, just fetch info for now)
export const getLectureDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        course: { select: { title: true } }
      }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      return;
    }

    // Generate Jitsi JWT token for this user and lecture
    const jitsiToken = generateJitsiToken(
      {
        id: req.user!.id,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName,
        email: req.user!.email,
        role: req.user!.role,
      },
      lecture.meetingUrl || `smart-lms-${lecture.id}`
    );

    res.json({ lecture, jitsiToken });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to parse file ID from Google Drive URL
const extractFileIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const uploadLectureThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: id as string }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return;
    }

    // Resolve or create Google Drive folder structure: courses/lectures/thumbnails
    const folderId = await getOrCreateFolderId([
      { path: 'courses', name: 'Courses' },
      { path: 'courses/lectures', name: 'Lectures' },
      { path: 'courses/lectures/thumbnails', name: 'Lecture Thumbnails' }
    ]);

    // Upload thumbnail file to Drive
    const uploadResult = await uploadFileToDrive(
      req.file.path,
      `thumbnail-lecture-${lecture.id}-${Date.now()}${path.extname(req.file.originalname)}`,
      req.file.mimetype,
      folderId
    );

    // If there is an existing thumbnail, delete it from Drive
    if (lecture.thumbnailUrl) {
      const oldFileId = extractFileIdFromUrl(lecture.thumbnailUrl);
      if (oldFileId) {
        await deleteFileFromDrive(oldFileId);
      }
    }

    // Update database
    const updatedLecture = await prisma.lecture.update({
      where: { id: id as string },
      data: { thumbnailUrl: `https://drive.google.com/thumbnail?id=${uploadResult.fileId}&sz=w800` }
    });

    await logActivity(req.user!.id, `Uploaded thumbnail for lecture: ${lecture.title}`, 'Lecture', lecture.id);

    // Remove local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ message: 'Lecture thumbnail uploaded successfully', lecture: updatedLecture });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload lecture thumbnail: ' + error.message });
  }
};
