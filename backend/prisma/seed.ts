import prisma from '../src/config/db';
import bcrypt from 'bcrypt';

async function main() {
  const commonPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  console.log('🌱 Starting database seeding...');

  // 1. Super Admin
  const superAdminEmail = 'admin@openlearnx.com';
  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: superAdminEmail,
        passwordHash: adminPasswordHash,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
      },
    });
    console.log('✅ Super Admin created: admin@openlearnx.com / admin123');
  }

  // 2. Sample Institute
  const instituteSlug = 'apex-tech';
  let institute = await prisma.institute.findUnique({ where: { slug: instituteSlug } });
  if (!institute) {
    institute = await prisma.institute.create({
      data: {
        name: 'Apex Tech Academy',
        slug: instituteSlug,
        email: 'contact@apextech.com',
        phone: '+1 555-0199',
        address: '100 Technology Way, San Francisco, CA',
        status: 'APPROVED',
        themeColor: '#3B82F6',
        description: 'Premier institute for software engineering and tech skills.',
      },
    });
    console.log('✅ Institute created: Apex Tech Academy (apex-tech)');
  }

  // 3. Institute Admin
  const adminEmail = 'admin@apextech.com';
  let instAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!instAdmin) {
    instAdmin = await prisma.user.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        isEmailVerified: true,
        instituteId: institute.id,
      },
    });
    console.log('✅ Institute Admin created: admin@apextech.com / admin123');
  }

  // 4. Teacher User & Profile
  const teacherEmail = 'teacher@apextech.com';
  let teacherUser = await prisma.user.findUnique({ where: { email: teacherEmail } });
  if (!teacherUser) {
    teacherUser = await prisma.user.create({
      data: {
        firstName: 'Alex',
        lastName: 'Rivera',
        email: teacherEmail,
        passwordHash: commonPasswordHash,
        role: 'TEACHER',
        isEmailVerified: true,
        instituteId: institute.id,
      },
    });
  }

  let teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        instituteId: institute.id,
        bio: 'Senior Full-Stack Engineer with 10+ years teaching experience.',
        title: 'Lead Technical Instructor',
        expertise: 'React, Node.js, TypeScript, PostgreSQL',
      },
    });
    console.log('✅ Teacher created: teacher@apextech.com / password123');
  }

  // 5. Student User & Profile
  const studentEmail = 'student@apextech.com';
  let studentUser = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        firstName: 'Jordan',
        lastName: 'Smith',
        email: studentEmail,
        passwordHash: commonPasswordHash,
        role: 'STUDENT',
        isEmailVerified: true,
        instituteId: institute.id,
      },
    });
  }

  let student = await prisma.student.findUnique({ where: { userId: studentUser.id } });
  if (!student) {
    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        instituteId: institute.id,
        studentIdNumber: 'STU-2026-001',
      },
    });
    console.log('✅ Student created: student@apextech.com / password123');
  }

  // 6. Sample Course
  const courseSlug = 'full-stack-web-development-mastery';
  let course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: 'Full-Stack Web Development Mastery',
        slug: courseSlug,
        description: 'Master modern frontend & backend skills using React, TypeScript, Express, and Prisma.',
        category: 'Web Development',
        level: 'INTERMEDIATE',
        status: 'PUBLISHED',
        isPublished: true,
        price: 99.99,
        instituteId: institute.id,
        teacherId: teacher.id,
      },
    });
    console.log('✅ Course created: Full-Stack Web Development Mastery');
  }

  // 7. Enrollment
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId: course.id },
  });

  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        status: 'ACTIVE',
        progress: 25.0,
      },
    });
    console.log('✅ Student enrolled in course.');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
