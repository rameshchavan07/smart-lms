import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError } from '../utils/AppError';

// Admin Dashboard Analytics
export const getAdminStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const totalUsers = await prisma.user.count();
    const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();

    const recentCourses = await prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { enrollments: true } }
      }
    });

    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    res.json({
      metrics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        totalEnrollments
      },
      recentCourses,
      recentActivities
    });
});

// Teacher Dashboard Analytics
export const getTeacherStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher) {
      throw new NotFoundError('Teacher record not found');
    }

    const totalCourses = await prisma.course.count({
      where: { teacherId: teacher.id }
    });

    const totalStudents = await prisma.enrollment.count({
      where: { course: { teacherId: teacher.id } }
    });

    const teacherCourses = await prisma.course.findMany({
      where: { teacherId: teacher.id },
      select: { id: true }
    });
    const courseIds = teacherCourses.map(c => c.id);

    const recentActivities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          {
            entityType: { in: ['Course', 'Enrollment', 'Lecture', 'StudyMaterial'] },
            entityId: { in: courseIds }
          }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    res.json({
      metrics: {
        totalCourses,
        totalStudents
      },
      recentActivities
    });
});

// Student Dashboard Analytics
export const getStudentStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      throw new NotFoundError('Student record not found');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          include: {
            quizzes: true,
            assignments: true
          }
        }
      }
    });

    const totalEnrollments = enrollments.length;

    const quizSubmissions = await prisma.quizSubmission.findMany({
      where: { studentId: student.id },
      include: { quiz: true }
    });

    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: student.id },
      include: { assignment: true }
    });

    // Calculate Quiz Average
    let totalQuizScore = 0;
    let totalQuizMarks = 0;
    quizSubmissions.forEach(sub => {
      totalQuizScore += sub.totalScore || 0;
      totalQuizMarks += sub.quiz.totalMarks;
    });
    const quizAverage = totalQuizMarks > 0 ? Math.round((totalQuizScore / totalQuizMarks) * 100) : 0;

    // Calculate Overall Progress (simplified logic: ratio of completed assessments vs total)
    let totalRequired = 0;
    let totalCompleted = 0;

    enrollments.forEach(enroll => {
      totalRequired += enroll.course.quizzes.length;
      totalRequired += enroll.course.assignments.length;
    });

    totalCompleted += quizSubmissions.length;
    totalCompleted += assignmentSubmissions.length;

    const overallProgress = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

    res.json({
      metrics: {
        totalEnrollments,
        totalCompleted: totalCompleted > 0 ? 1 : 0, // Mock completed courses based on progress
        quizAverage,
        badgesEarned: Math.floor(totalCompleted / 5), // Mock badges
        overallProgress,
        progressBreakdown: { excellent: 2, good: 1, average: 0 }
      }
    });
});

export const getTeacherReports = catchAsync(async (req: AuthRequest, res: Response) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
    if (!teacher) {
      throw new NotFoundError('Teacher not found');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { course: { teacherId: teacher.id } }
    });

    const courses = await prisma.course.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: { select: { enrollments: true } }
      }
    });

    const coursePerformance = courses.map(c => ({
      name: c.title,
      avgScore: Math.floor(Math.random() * 40) + 60 // Mocked score logic for visual until full grading system calculates it
    }));

    const engagementData = [
      { month: 'Jan', students: 120, engagement: 85 },
      { month: 'Feb', students: 132, engagement: 88 },
      { month: 'Mar', students: 145, engagement: 92 },
      { month: 'Apr', students: 130, engagement: 90 },
      { month: 'May', students: 155, engagement: 95 },
      { month: 'Jun', students: enrollments.length, engagement: 98 },
    ];

    res.json({
      metrics: {
        totalStudents: enrollments.length,
        avgEngagement: 92,
        courseCompletion: 78,
        avgQuizScore: 81
      },
      engagementData,
      coursePerformance
    });
});

export const getAdminReports = catchAsync(async (req: AuthRequest, res: Response) => {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalCourses = await prisma.course.count();
    const enrollments = await prisma.enrollment.count();

    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } }
      },
      take: 5,
      orderBy: { enrollments: { _count: 'desc' } }
    });

    const coursePerformance = courses.map(c => ({
      name: c.title,
      avgScore: Math.floor(Math.random() * 40) + 60 // Mocked score logic
    }));

    const engagementData = [
      { month: 'Jan', students: Math.floor(totalStudents * 0.5), engagement: 70 },
      { month: 'Feb', students: Math.floor(totalStudents * 0.6), engagement: 75 },
      { month: 'Mar', students: Math.floor(totalStudents * 0.8), engagement: 82 },
      { month: 'Apr', students: Math.floor(totalStudents * 0.85), engagement: 85 },
      { month: 'May', students: Math.floor(totalStudents * 0.9), engagement: 90 },
      { month: 'Jun', students: totalStudents, engagement: 95 },
    ];

    res.json({
      metrics: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalEnrollments: enrollments
      },
      engagementData,
      coursePerformance
    });
});

export const getStudentPerformance = catchAsync(async (req: AuthRequest, res: Response) => {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      throw new NotFoundError('Student record not found');
    }

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d,
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        score: Math.floor(Math.random() * 20) + 70 // Base score
      };
    });

    const recentSubmissions = await prisma.quizSubmission.findMany({
      where: {
        studentId: student.id,
        submittedAt: { gte: last7Days[0].date }
      }
    });

    recentSubmissions.forEach(sub => {
      const day = last7Days.find(d => d.date.toDateString() === sub.submittedAt.toDateString());
      if (day) {
         day.score = Math.min(100, day.score + (sub.totalScore || 10));
      }
    });

    res.json({ data: last7Days.map(d => ({ name: d.name, score: d.score })) });
});

export const getTeacherWeeklyProgress = catchAsync(async (req: AuthRequest, res: Response) => {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher) {
      throw new NotFoundError('Teacher record not found');
    }

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        progress: Math.floor(Math.random() * 20) + 60,
        submissions: 0
      };
    });

    const courses = await prisma.course.findMany({ where: { teacherId: teacher.id }, select: { id: true } });
    const courseIds = courses.map(c => c.id);

    const recentAssignments = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: { courseId: { in: courseIds } },
        submittedAt: { gte: last7Days[0].date }
      }
    });

    recentAssignments.forEach(sub => {
      const day = last7Days.find(d => d.date.toDateString() === sub.submittedAt.toDateString());
      if (day) {
         day.submissions += 1;
      }
    });

    res.json({ data: last7Days.map(d => ({ day: d.day, progress: d.progress, submissions: d.submissions })) });
});
