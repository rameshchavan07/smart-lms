import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError } from '../utils/AppError';
import { getCache, setCache } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

// Admin Dashboard Analytics
export const getAdminStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const cacheKey = CACHE_KEYS.ADMIN_STATS + (req.user!.instituteId || 'global');
    const cached = await getCache<object>(cacheKey);
    if (cached) return res.json(cached);

    const instituteId = req.user!.role !== 'SUPER_ADMIN' ? req.user!.instituteId : undefined;
    const whereInstitute = instituteId ? { instituteId } : {};
    const whereCourseInstitute = instituteId ? { course: { instituteId } } : {};

    const totalUsers = await prisma.user.count({ where: whereInstitute });
    const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER', ...whereInstitute } });
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT', ...whereInstitute } });
    const totalCourses = await prisma.course.count({ where: whereInstitute });
    const totalEnrollments = await prisma.enrollment.count({ where: whereCourseInstitute });

    const recentCourses = await prisma.course.findMany({
      where: whereInstitute,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { enrollments: true } }
      }
    });

    const recentActivities = await prisma.auditLog.findMany({
      where: instituteId ? { user: { instituteId } } : {},
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    const payload = {
      metrics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        totalEnrollments
      },
      recentCourses,
      recentActivities
    };

    await setCache(cacheKey, payload, CACHE_TTL.ADMIN_STATS);
    res.json(payload);
});

// Teacher Dashboard Analytics
export const getTeacherStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const cacheKey = CACHE_KEYS.TEACHER_STATS(req.user!.id);
    const cached = await getCache<object>(cacheKey);
    if (cached) return res.json(cached);

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

    const payload = {
      metrics: {
        totalCourses,
        totalStudents
      },
      recentActivities
    };

    await setCache(cacheKey, payload, CACHE_TTL.TEACHER_STATS);
    res.json(payload);
});

// Student Dashboard Analytics
export const getStudentStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const cacheKey = CACHE_KEYS.STUDENT_STATS(req.user!.id);
    const cached = await getCache<object>(cacheKey);
    if (cached) return res.json(cached);

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

    const payload = {
      metrics: {
        totalEnrollments,
        totalCompleted: totalCompleted > 0 ? 1 : 0,
        quizAverage,
        badgesEarned: Math.floor(totalCompleted / 5),
        overallProgress,
        progressBreakdown: { excellent: 2, good: 1, average: 0 }
      }
    };

    await setCache(cacheKey, payload, CACHE_TTL.STUDENT_STATS);
    res.json(payload);
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
    const instituteId = req.user!.role !== 'SUPER_ADMIN' ? req.user!.instituteId : undefined;
    const whereInstituteUser = instituteId ? { user: { instituteId } } : {};
    const whereCourse = instituteId ? { instituteId } : {};
    const whereEnrollment = instituteId ? { course: { instituteId } } : {};

    const totalStudents = await prisma.student.count({ where: whereInstituteUser });
    const totalTeachers = await prisma.teacher.count({ where: whereInstituteUser });
    const totalCourses = await prisma.course.count({ where: whereCourse });
    const enrollments = await prisma.enrollment.count({ where: whereEnrollment });

    const courses = await prisma.course.findMany({
      where: whereCourse,
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
