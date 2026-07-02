import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { generateJitsiToken } from '../services/jitsi.service';
import { logActivity } from '../utils/auditLogger';
import path from 'path';
import fs from 'fs';
import { getOrCreateFolderId, uploadFileToDrive, deleteFileFromDrive } from '../services/googleDriveService';
import { createNotification } from '../services/notificationService';

import prisma from '../config/db';

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
    const meetingId = `open-learn-x-${uuidv4()}`;

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

    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { select: { userId: true } } }
    });

    await Promise.all(
      enrollments.map(e =>
        createNotification(
          e.student.userId,
          'New Live Lecture Scheduled',
          `A new lecture "${title}" has been scheduled for course "${course.title}".`
        ).catch(err => console.error('Lecture notification error:', err))
      )
    );

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
      lecture.meetingUrl || `open-learn-x-${lecture.id}`
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

// Update an existing lecture (Teacher only)
export const updateLecture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, startTime, endTime } = req.body;

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      return;
    }

    if (lecture.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'You can only edit your own lectures' });
      return;
    }

    const updatedLecture = await prisma.lecture.update({
      where: { id },
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      }
    });

    // @ts-ignore
    await logActivity(req.user!.id, `Updated lecture: ${title} for course: ${lecture.course?.title || lecture.courseId}`, 'Lecture', lecture.id);

    res.json({ message: 'Lecture updated successfully', lecture: updatedLecture });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadLectureThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: id as string },
      include: { course: true }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return;
    }

    // Resolve directories
    const courseSlug = `${slugify(lecture.course.title)}_${lecture.course.id}`;
    const lectureSlug = `${slugify(lecture.title)}_${lecture.id}`;
    const targetDir = path.join(process.cwd(), 'uploads', 'Courses', courseSlug, 'Lectures', lectureSlug);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Save as thumbnail.{ext}
    const ext = path.extname(req.file.originalname) || '.jpg';
    const newFilename = `thumbnail${ext}`;
    const newFilePath = path.join(targetDir, newFilename);

    // If there is an existing local thumbnail, delete it
    if (lecture.thumbnailUrl && lecture.thumbnailUrl.includes('/uploads/Courses/')) {
      const oldRelativePath = lecture.thumbnailUrl.split('/uploads/')[1];
      const oldLocalFilePath = path.join(process.cwd(), 'uploads', oldRelativePath);
      if (fs.existsSync(oldLocalFilePath)) {
        try {
          fs.unlinkSync(oldLocalFilePath);
        } catch (e) {
          console.warn('Failed to delete old thumbnail:', e);
        }
      }
    }

    // Move file
    fs.copyFileSync(req.file.path, newFilePath);
    fs.unlinkSync(req.file.path);

    // Build public URL path
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/Courses/${courseSlug}/Lectures/${lectureSlug}/${newFilename}`;

    // Update database
    const updatedLecture = await prisma.lecture.update({
      where: { id: id as string },
      data: { thumbnailUrl: fileUrl }
    });

    await logActivity(req.user!.id, `Uploaded thumbnail for lecture: ${lecture.title}`, 'Lecture', lecture.id);

    res.json({ message: 'Lecture thumbnail uploaded successfully', lecture: updatedLecture });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload lecture thumbnail: ' + error.message });
  }
};

export const uploadLectureRecording = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ message: 'No video file provided' });
      return;
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: id as string },
      include: { course: true }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return;
    }

    // Resolve Google Drive target folder: courses/courseId/Lectures/lectureId
    const pathComponents = [
      { path: `courses/${lecture.course.id}`, name: `Course - ${lecture.course.title}` },
      { path: `courses/${lecture.course.id}/Lectures`, name: 'Lectures' },
      { path: `courses/${lecture.course.id}/Lectures/${lecture.id}`, name: `Lecture - ${lecture.title}` },
    ];

    const targetFolderId = await getOrCreateFolderId(pathComponents);

    // If there is an existing Google Drive recording, delete it
    if (lecture.recordingUrl) {
      let oldFileId = null;
      if (lecture.recordingUrl.includes('/api/media/drive/')) {
        oldFileId = lecture.recordingUrl.split('/api/media/drive/')[1];
      } else if (lecture.recordingUrl.includes('drive.google.com/file/d/')) {
        const match = lecture.recordingUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) oldFileId = match[1];
      }

      if (oldFileId) {
        try {
          await deleteFileFromDrive(oldFileId);
        } catch (e) {
          console.warn('Failed to delete old recording from Google Drive:', e);
        }
      }
    } else if (lecture.recordingUrl && lecture.recordingUrl.includes('/uploads/Courses/')) {
      // Cleanup old local file if migrating
      const oldRelativePath = lecture.recordingUrl.split('/uploads/')[1];
      const oldLocalFilePath = path.join(process.cwd(), 'uploads', oldRelativePath);
      if (fs.existsSync(oldLocalFilePath)) {
        try { fs.unlinkSync(oldLocalFilePath); } catch (e) {}
      }
    }

    // Upload to Google Drive
    const result = await uploadFileToDrive(
      req.file.path,
      req.file.originalname || `recording-${lecture.id}.webm`,
      req.file.mimetype || 'video/webm',
      targetFolderId
    );

    // Save to GoogleDriveFile table
    await prisma.googleDriveFile.create({
      data: {
        driveFileId: result.fileId,
        fileName: req.file.originalname || `recording-${lecture.id}.webm`,
        fileUrl: result.webViewLink || '',
        uploadedBy: req.user!.id,
      }
    });

    const recordingDuration = req.body.duration ? parseInt(req.body.duration, 10) : null;
    const recordingSize = req.file.size || null;

    // Cleanup temp file after successful upload
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    // Use direct Google Drive web view link
    const fileUrl = result.webViewLink || '';

    // Update database
    const updatedLecture = await prisma.lecture.update({
      where: { id: id as string },
      data: { 
        recordingUrl: fileUrl,
        recordingDuration,
        recordingSize
      }
    });

    await logActivity(req.user!.id, `Uploaded recording for lecture: ${lecture.title}`, 'Lecture', lecture.id);

    res.json({ message: 'Lecture recording uploaded successfully', lecture: updatedLecture });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload lecture recording: ' + error.message });
  }
};

// Delete lecture recording (Teacher only)
export const deleteLectureRecording = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      return;
    }

    // Authorisation: must be the teacher who created the lecture or an admin
    if (lecture.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'You can only delete recordings from your own lectures' });
      return;
    }

    if (!lecture.recordingUrl) {
      res.status(400).json({ message: 'This lecture has no recording to delete' });
      return;
    }

    // Extract Google Drive file ID from the stored URL
    let driveFileId: string | null = null;
    if (lecture.recordingUrl.includes('/api/media/drive/')) {
      driveFileId = lecture.recordingUrl.split('/api/media/drive/')[1];
    } else if (lecture.recordingUrl.includes('drive.google.com')) {
      const match = lecture.recordingUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) driveFileId = match[1];
    }

    // Delete from Google Drive and the tracking table
    if (driveFileId) {
      try {
        await deleteFileFromDrive(driveFileId);
      } catch (e) {
        console.warn('Failed to delete recording from Google Drive:', e);
      }

      // Remove the GoogleDriveFile record (match by fileId)
      const driveRecord = await prisma.googleDriveFile.findFirst({
        where: { driveFileId },
      });
      if (driveRecord) {
        await prisma.googleDriveFile.delete({ where: { id: driveRecord.id } });
      }
    } else if (lecture.recordingUrl.includes('/uploads/Courses/')) {
      // Fallback: local file (legacy)
      const oldRelativePath = lecture.recordingUrl.split('/uploads/')[1];
      const oldLocalFilePath = path.join(process.cwd(), 'uploads', oldRelativePath);
      if (fs.existsSync(oldLocalFilePath)) {
        try { fs.unlinkSync(oldLocalFilePath); } catch (_) {}
      }
    }

    // Clear recording fields on the lecture
    const updatedLecture = await prisma.lecture.update({
      where: { id },
      data: {
        recordingUrl: null,
        recordingDuration: null,
        recordingSize: null,
      },
    });

    // @ts-ignore
    await logActivity(req.user!.id, `Deleted recording for lecture: ${lecture.title} in course: ${lecture.course?.title || lecture.courseId}`, 'Lecture', lecture.id);

    res.json({ message: 'Lecture recording deleted successfully', lecture: updatedLecture });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete lecture recording: ' + error.message });
  }
};

// Helper function to slugify names
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}
