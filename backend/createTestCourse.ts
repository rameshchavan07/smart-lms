import 'dotenv/config';
import prisma from './src/config/db';

async function main() {
  const institute = await prisma.institute.findUnique({ where: { slug: 'demo' } });
  if (!institute) throw new Error('Institute not found');

  const studentUser = await prisma.user.findUnique({ where: { email: 'student@demo.com' } });
  if (!studentUser) throw new Error('Student user not found');

  const student = await prisma.student.findUnique({ where: { userId: studentUser.id } }) 
    || await prisma.student.create({ data: { userId: studentUser.id, enrollmentNumber: 'ENR-1234' } });

  const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@demo.com' } })
    || await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Teacher',
        email: 'teacher@demo.com',
        role: 'TEACHER',
        instituteId: institute.id,
        isEmailVerified: true,
        isApproved: true,
      }
    });

  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } })
    || await prisma.teacher.create({ data: { userId: teacherUser.id, employeeCode: 'EMP-1234' } });

  const course = await prisma.course.findFirst({ where: { title: 'Intro to Kotlin for Android' } })
    || await prisma.course.create({
      data: {
        title: 'Intro to Kotlin for Android',
        description: 'Learn how to build Android apps with Kotlin and Jetpack Compose.',
        teacherId: teacher.id,
        instituteId: institute.id,
        status: 'ACTIVE'
      }
    });

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } }
  }) || await prisma.enrollment.create({
    data: { studentId: student.id, courseId: course.id }
  });

  console.log('Created test course and enrolled student:', course.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
