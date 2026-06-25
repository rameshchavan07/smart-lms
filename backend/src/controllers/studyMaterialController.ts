import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { uploadFileToDrive, deleteFileFromDrive, getOrCreateFolderId } from '../services/googleDriveService';
import fs from 'fs';
import { logActivity } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Upload study material (Teacher only)
export const uploadMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const { title, description } = req.body;

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Verify course exists and belongs to this teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id },
      include: { user: true }
    });

    if (!teacher) {
      res.status(403).json({ message: 'Only teachers can upload study materials' });
      // Cleanup file if user is unauthorized
      fs.unlinkSync(req.file.path);
      return;
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: teacher.id }
    });

    if (!course) {
      res.status(404).json({ message: 'Course not found or you are not assigned to it' });
      // Cleanup file if course is not found
      fs.unlinkSync(req.file.path);
      return;
    }

    // Resolve Google Drive target folder: courses/courseId/Teachers/teacherId
    const teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;
    const pathComponents = [
      { path: `courses/${courseId}`, name: `Course - ${course.title}` },
      { path: `courses/${courseId}/Teachers`, name: 'Teachers' },
      { path: `courses/${courseId}/Teachers/${teacher.id}`, name: teacherName },
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
        driveFileId: result.fileId,
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

    res.status(201).json({
      message: 'Study material uploaded successfully',
      studyMaterial
    });

  } catch (error: any) {
    console.error('Upload error:', error?.message || error);
    // Cleanup temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};

// Get study materials for a course (Student & Teacher)
export const getCourseMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;

    // Verify course access
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (!student) {
        res.status(403).json({ message: 'Student record not found' });
        return;
      }
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: student.id, courseId } }
      });
      if (!enrollment) {
        res.status(403).json({ message: 'You are not enrolled in this course' });
        return;
      }
    } else if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      if (!teacher) {
        res.status(403).json({ message: 'Teacher record not found' });
        return;
      }
      const course = await prisma.course.findFirst({
        where: { id: courseId, teacherId: teacher.id }
      });
      if (!course) {
        res.status(403).json({ message: 'You are not assigned to this course' });
        return;
      }
    }

    const materials = await prisma.studyMaterial.findMany({
      where: { courseId },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ materials });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete study material (Teacher only)
export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const studyMaterial = await prisma.studyMaterial.findUnique({
      where: { id }
    });

    if (!studyMaterial) {
      res.status(404).json({ message: 'Study material not found' });
      return;
    }

    // Verify user is teacher assigned to the course
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher && req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    if (req.user!.role !== 'ADMIN') {
      const course = await prisma.course.findFirst({
        where: { id: studyMaterial.courseId, teacherId: teacher!.id }
      });

      if (!course) {
        res.status(403).json({ message: 'You cannot delete materials from a course you do not teach' });
        return;
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

    res.json({ message: 'Study material deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
