import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { AttendanceStatus } from '@prisma/client';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lectureId = req.params.lectureId as string;
    const { action } = req.body; // 'join' or 'leave'

    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(403).json({ message: 'Only students can mark attendance' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId }
    });

    if (!lecture) {
      res.status(404).json({ message: 'Lecture not found' });
      return;
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
        res.status(404).json({ message: 'Attendance record not found to mark leave' });
        return;
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { leaveTime: now }
      });

      res.status(200).json({ message: 'Leave time marked', attendance });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLectureAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
      res.status(404).json({ message: 'Lecture not found' });
      return;
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
  } catch (error) {
    console.error('Get lecture attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(403).json({ message: 'Only students can view their attendance' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
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
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
