import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { AttendanceStatus } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';

export const markAttendance = catchAsync(async (req: AuthRequest, res: Response) => {
  const lectureId = req.params.lectureId as string;
  const { action } = req.body; // 'join' or 'leave'

  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Only students can mark attendance');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id }
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  // Find existing attendance
  let attendance = await prisma.attendance.findFirst({
    where: {
      lectureId,
      studentId: student.id
    }
  });

  const now = new Date();

  if (action === 'join') {
    if (attendance) {
      res.status(200).json({ message: 'Already marked as joined', attendance });
      return;
    }

    // Determine status (Late if > 15 mins after start time)
    const startTime = new Date(lecture.startTime);
    const diffMinutes = (now.getTime() - startTime.getTime()) / 60000;
    const status = diffMinutes > 15 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    attendance = await prisma.attendance.create({
      data: {
        lectureId,
        studentId: student.id,
        joinTime: now,
        status
      }
    });

    res.status(201).json({ message: 'Attendance marked', attendance });
  } else if (action === 'leave') {
    if (!attendance) {
      throw new NotFoundError('Attendance record not found to mark leave');
    }

    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { leaveTime: now }
    });

    res.status(200).json({ message: 'Leave time marked', attendance });
  } else {
    throw new ValidationError('Invalid action');
  }
});

export const getLectureAttendance = catchAsync(async (req: AuthRequest, res: Response) => {
  const lectureId = req.params.lectureId as string;
  
  // Make sure lecture exists and we get courseId to get enrolled students
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      attendance: {
        include: {
          student: {
            include: { user: true }
          }
        }
      },
      course: {
        include: {
          enrollments: {
            include: {
              student: {
                include: { user: true }
              }
            }
          }
        }
      }
    }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  const enrollments = lecture.course.enrollments;
  const attendanceRecords = lecture.attendance;

  // Build comprehensive list
  const report = enrollments.map(e => {
    const record = attendanceRecords.find(a => a.studentId === e.student.id);
    return {
      studentId: e.student.id,
      firstName: e.student.user.firstName,
      lastName: e.student.user.lastName,
      enrollmentNumber: e.student.enrollmentNumber,
      status: record ? record.status : AttendanceStatus.ABSENT,
      joinTime: record?.joinTime || null,
      leaveTime: record?.leaveTime || null
    };
  });

  res.status(200).json({ attendance: report });
});

export const getMyAttendance = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Only students can view their attendance');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id }
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: {
      lecture: {
        include: { course: true }
      }
    },
    orderBy: { lecture: { startTime: 'desc' } }
  });

  res.status(200).json({ attendance });
});

export const exportLectureAttendance = catchAsync(async (req: AuthRequest, res: Response) => {
  const lectureId = req.params.lectureId as string;
  
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      attendance: {
        include: {
          student: {
            include: { user: true }
          }
        }
      },
      course: {
        include: {
          enrollments: {
            include: {
              student: {
                include: { user: true }
              }
            }
          }
        }
      }
    }
  });

  if (!lecture) {
    throw new NotFoundError('Lecture not found');
  }

  const enrollments = lecture.course.enrollments;
  const attendanceRecords = lecture.attendance;

  // Build comprehensive list
  const report = enrollments.map(e => {
    const record = attendanceRecords.find(a => a.studentId === e.student.id);
    return {
      studentId: e.student.id,
      firstName: e.student.user.firstName,
      lastName: e.student.user.lastName,
      enrollmentNumber: e.student.enrollmentNumber || '',
      status: record ? record.status : AttendanceStatus.ABSENT,
      joinTime: record?.joinTime || '',
      leaveTime: record?.leaveTime || ''
    };
  });

  // Basic CSV Generation
  const header = ['First Name', 'Last Name', 'Enrollment Number', 'Status', 'Join Time', 'Leave Time'].join(',');
  const rows = report.map(r => {
    const jTime = r.joinTime ? new Date(r.joinTime).toLocaleTimeString() : 'N/A';
    const lTime = r.leaveTime ? new Date(r.leaveTime).toLocaleTimeString() : 'N/A';
    return [
      `"${r.firstName || ''}"`,
      `"${r.lastName || ''}"`,
      `"${r.enrollmentNumber || ''}"`,
      `"${r.status || ''}"`,
      `"${jTime}"`,
      `"${lTime}"`
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${lectureId}.csv"`);
  res.status(200).send(csv);
});
