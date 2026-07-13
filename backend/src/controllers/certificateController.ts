import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import PDFDocument from 'pdfkit';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';
import { sendCertificateEmail } from '../services/emailService';

export const generateCertificate = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;
  
  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Only students can generate certificates');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { user: true }
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: { include: { user: true } } }
  });

  if (!course) {
    throw new NotFoundError('Course not found');
  }

    // Check if certificate already exists
    let certificate = await prisma.certificate.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: course.id
        }
      }
    });

    let isNewCertificate = false;

    if (!certificate) {
      // First verify progress is 100%
      const totalLectures = await prisma.lecture.count({ where: { courseId } });
      const totalAssignments = await prisma.assignment.count({ where: { courseId } });
      const totalQuizzes = await prisma.quiz.count({ where: { courseId } });
      const totalItems = totalLectures + totalAssignments + totalQuizzes;

      const attendedLectures = await prisma.attendance.count({ where: { studentId: student.id, lecture: { courseId } } });
      const submittedAssignments = await prisma.assignmentSubmission.count({ where: { studentId: student.id, assignment: { courseId } } });
      const submittedQuizzes = await prisma.quizSubmission.count({ where: { studentId: student.id, quiz: { courseId } } });

      const completedItems = attendedLectures + submittedAssignments + submittedQuizzes;
      const progressPercentage = totalItems === 0 ? 0 : Math.min(100, Math.round((completedItems / totalItems) * 100));

    if (progressPercentage < 100 && totalItems > 0) {
      throw new ValidationError('Course is not fully completed yet');
    }

      certificate = await prisma.certificate.create({
        data: {
          studentId: student.id,
          courseId: course.id
        }
      });
      isNewCertificate = true;
    }

    let templateBuffer: ArrayBuffer | null = null;
    if (course.certificateTemplateUrl) {
      try {
        const response = await fetch(course.certificateTemplateUrl);
        templateBuffer = await response.arrayBuffer();
      } catch (err) {
        console.error('Failed to fetch certificate template', err);
      }
    }

    // Generate PDF Certificate
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${course.title.replace(/\s+/g, '-')}.pdf`);

    // We need to capture the PDF buffer to send via email if it's new
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      if (isNewCertificate) {
        const pdfBuffer = Buffer.concat(chunks);
        sendCertificateEmail(student.user.email, student.user.firstName, course.title, pdfBuffer)
          .catch(err => console.error('Failed to send certificate email:', err));
      }
    });

    doc.pipe(res);

    // Certificate Design
    if (templateBuffer) {
      // Use Custom Template Background
      doc.image(templateBuffer, 0, 0, { width: doc.page.width, height: doc.page.height });
      // Overlay Text in the center
      doc.fontSize(45).fillColor('#1e293b').text(`${student.user.firstName} ${student.user.lastName}`, 0, doc.page.height / 2 - 20, { align: 'center' });
      const issueDate = certificate.issueDate.toLocaleDateString();
      doc.fontSize(15).fillColor('#64748b').text(`Date: ${issueDate}`, 150, doc.page.height - 100);
      doc.fontSize(10).fillColor('#94a3b8').text(`Certificate ID: ${certificate.id}`, 0, doc.page.height - 50, { align: 'center' });
    } else {
      // Default Design
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#06b6d4').lineWidth(5);
      
      doc.fontSize(40).fillColor('#1e293b').text('Certificate of Completion', { align: 'center' }).moveDown(1);
      doc.fontSize(20).fillColor('#64748b').text('This is to certify that', { align: 'center' }).moveDown(1);
      doc.fontSize(35).fillColor('#06b6d4').text(`${student.user.firstName} ${student.user.lastName}`, { align: 'center' }).moveDown(1);
      doc.fontSize(20).fillColor('#64748b').text('has successfully completed the course', { align: 'center' }).moveDown(1);
      doc.fontSize(25).fillColor('#1e293b').text(course.title, { align: 'center' }).moveDown(2);
      
      const issueDate = certificate.issueDate.toLocaleDateString();
      doc.fontSize(15).fillColor('#64748b').text(`Date: ${issueDate}`, 100, doc.page.height - 150);
      
      if (course.teacher) {
        doc.fontSize(15).fillColor('#64748b').text(`Instructor: ${course.teacher.user.firstName} ${course.teacher.user.lastName}`, doc.page.width - 300, doc.page.height - 150);
      }
      doc.fontSize(10).fillColor('#94a3b8').text(`Certificate ID: ${certificate.id}`, 0, doc.page.height - 50, { align: 'center' });
    }

  doc.end();
});

export const getMyCertificates = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Only students can view their certificates');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id }
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    include: {
      course: true
    },
    orderBy: { issueDate: 'desc' }
  });

  res.status(200).json({ certificates });
});
