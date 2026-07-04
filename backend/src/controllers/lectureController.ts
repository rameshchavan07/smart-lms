import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { generateJitsiToken } from '../services/jitsi.service';
import { logActivity } from '../utils/auditLogger';
import path from 'path';
import fs from 'fs';
import { getOrCreateFolderId, uploadFileToDrive, deleteFileFromDrive } from '../services/googleDriveService';
import { createNotification } from '../services/notificationService';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../utils/AppError';
import { getCache, setCache, invalidateCache } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

import prisma from '../config/db';

// Create a new lecture (Teacher only)
export const createLecture = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;
  const { title, description, startTime, endTime } = req.body;

  // Verify course belongs to this teacher
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user!.id }
  });

  if (!teacher) {
    throw new ForbiddenError('Only teachers can create lectures');
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: teacher.id }
  });

  if (!course) {
    throw new NotFoundError('Course not found or you are not assigned to it');
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

  // Invalidate lecture list cache for this course
  await invalidateCache(CACHE_KEYS.COURSE_LECTURES(courseId));

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
});

// Get all lectures for a course
export const getCourseLectures = catchAsync(async (req: AuthRequest, res: Response) => {
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
        throw new ForbiddenError('You are not enrolled in this course');
      }
    }
  }

  const cacheKey = CACHE_KEYS.COURSE_LECTURES(courseId);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const lectures = await prisma.lecture.findMany({
    where: { courseId },
    orderBy: { startTime: 'asc' }
  });

  const payload = { lectures };
  await setCache(cacheKey, payload, CACHE_TTL.COURSE_LECTURES);
  res.json(payload);
});

// Join a lecture (record attendance logic later, just fetch info for now)
export const getLectureDetails = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  
  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: {
      course: { select: { title: true } }
    }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  // Generate Jitsi JWT token for this user and lecture
  const jitsiToken = generateJitsiToken(
    {
      id: req.user!.id,
      firstName: req.user!.firstName || '',
      lastName: req.user!.lastName || '',
      email: req.user!.email,
      role: req.user!.role,
    },
    lecture.meetingUrl || `open-learn-x-${lecture.id}`
  );

  res.json({ lecture, jitsiToken });
});

// Helper to parse file ID from Google Drive URL
const extractFileIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Update an existing lecture (Teacher only)
export const updateLecture = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { title, description, startTime, endTime } = req.body;

  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: { course: true }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  if (lecture.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You can only edit your own lectures');
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

  // Invalidate the lecture list cache for this course
  await invalidateCache(CACHE_KEYS.COURSE_LECTURES(lecture.courseId));

  res.json({ message: 'Lecture updated successfully', lecture: updatedLecture });
});

// Delete a lecture (Teacher only)
export const deleteLecture = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: { course: true }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  if (lecture.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You can only delete your own lectures');
  }

  // Delete associated recording from Google Drive if it exists
  if (lecture.recordingUrl) {
    let driveFileId: string | null = null;
    if (lecture.recordingUrl.includes('/api/media/drive/')) {
      driveFileId = lecture.recordingUrl.split('/api/media/drive/')[1];
    } else if (lecture.recordingUrl.includes('drive.google.com')) {
      const match = lecture.recordingUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) driveFileId = match[1];
    }

    if (driveFileId) {
      try {
        await deleteFileFromDrive(driveFileId);
      } catch (e) {
        console.warn('Failed to delete recording from Google Drive:', e);
      }
      
      const driveRecord = await prisma.googleDriveFile.findFirst({
        where: { driveFileId },
      });
      if (driveRecord) {
        await prisma.googleDriveFile.delete({ where: { id: driveRecord.id } });
      }
    }
  }

  // Delete associated attendance records to satisfy foreign key constraints
  await prisma.attendance.deleteMany({
    where: { lectureId: id }
  });

  await prisma.lecture.delete({
    where: { id }
  });

  // @ts-ignore
  await logActivity(req.user!.id, `Deleted lecture: ${lecture.title} from course: ${lecture.course?.title || lecture.courseId}`, 'Lecture', id);

  // Invalidate the lecture list cache for this course
  await invalidateCache(CACHE_KEYS.COURSE_LECTURES(lecture.courseId));

  res.json({ message: 'Lecture deleted successfully' });
});

export const uploadLectureThumbnail = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.file) {
    throw new ValidationError('No image file provided');
  }

  const lecture = await prisma.lecture.findUnique({
    where: { id: id as string },
    include: { 
      course: {
        include: { institute: { select: { name: true } } }
      } 
    }
  });

  if (!lecture) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw new NotFoundError('Lecture not found');
  }

  const instName = lecture.course.institute?.name || 'Global';
  const instId = lecture.course.instituteId || 'global';
  const courseName = lecture.course.title;
  const cId = lecture.course.id;

  // Resolve Google Drive target folder: Institutes/[Institute]/Courses/[Course]/Videos
  const pathComponents = [
    { path: 'institutes', name: 'Institutes' },
    { path: `institutes/${instId}`, name: instName },
    { path: `institutes/${instId}/courses`, name: 'Courses' },
    { path: `institutes/${instId}/courses/${cId}`, name: courseName },
    { path: `institutes/${instId}/courses/${cId}/Videos`, name: 'Videos' }
  ];

  const targetFolderId = await getOrCreateFolderId(pathComponents);

  // If there is an existing Google Drive thumbnail, delete it
  if (lecture.thumbnailUrl) {
    let oldFileId = null;
    if (lecture.thumbnailUrl.includes('drive.google.com/thumbnail?id=')) {
      const match = lecture.thumbnailUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (match) oldFileId = match[1];
    }

    if (oldFileId) {
      try {
        await deleteFileFromDrive(oldFileId);
      } catch (e) {
        console.warn('Failed to delete old thumbnail from Google Drive:', e);
      }
    }
  }

  // Upload to Google Drive
  const ext = path.extname(req.file.originalname) || '.jpg';
  const newFilename = `thumbnail-${lecture.id}-${Date.now()}${ext}`;
  
  const result = await uploadFileToDrive(
    req.file.path,
    newFilename,
    req.file.mimetype || 'image/jpeg',
    targetFolderId
  );

  // Cleanup temp file after successful upload
  if (req.file && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
  }

  // Use Google Drive thumbnail link
  const fileUrl = `https://drive.google.com/thumbnail?id=${result.fileId}&sz=w800`;

  // Update database
  const updatedLecture = await prisma.lecture.update({
    where: { id: id as string },
    data: { thumbnailUrl: fileUrl }
  });

  await logActivity(req.user!.id, `Uploaded thumbnail for lecture: ${lecture.title}`, 'Lecture', lecture.id);

  res.json({ message: 'Lecture thumbnail uploaded successfully', lecture: updatedLecture });
});

export const uploadLectureRecording = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.file) {
    throw new ValidationError('No video file provided');
  }

  const lecture = await prisma.lecture.findUnique({
    where: { id: id as string },
    include: { 
      course: {
        include: { institute: { select: { name: true } } }
      } 
    }
  });

  if (!lecture) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw new NotFoundError('Lecture not found');
  }

  const instName = lecture.course.institute?.name || 'Global';
  const instId = lecture.course.instituteId || 'global';
  const courseName = lecture.course.title;
  const cId = lecture.course.id;

  // Resolve Google Drive target folder: Institutes/[Institute]/Courses/[Course]/Videos
  const pathComponents = [
    { path: 'institutes', name: 'Institutes' },
    { path: `institutes/${instId}`, name: instName },
    { path: `institutes/${instId}/courses`, name: 'Courses' },
    { path: `institutes/${instId}/courses/${cId}`, name: courseName },
    { path: `institutes/${instId}/courses/${cId}/Videos`, name: 'Videos' }
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
      driveFileId: result.fileId || '',
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
});

// Delete lecture recording (Teacher only)
export const deleteLectureRecording = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  // Authorisation: must be the teacher who created the lecture or an admin
  if (lecture.createdBy !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ForbiddenError('You can only delete recordings from your own lectures');
  }

  if (!lecture.recordingUrl) {
    throw new ValidationError('This lecture has no recording to delete');
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
});

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
