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

  const customSuperAdminEmail = 'xdrutu123@gmail.com';
  let customSuperAdmin = await prisma.user.findUnique({ where: { email: customSuperAdminEmail } });
  if (customSuperAdmin) {
    await prisma.user.update({
      where: { email: customSuperAdminEmail },
      data: { role: 'SUPER_ADMIN', isEmailVerified: true, isActive: true, isApproved: true },
    });
    console.log('✅ Updated xdrutu123@gmail.com to SUPER_ADMIN.');
  } else {
    await prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: customSuperAdminEmail,
        passwordHash: adminPasswordHash,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        isActive: true,
        isApproved: true,
      },
    });
    console.log('✅ Created Super Admin: xdrutu123@gmail.com / admin123');
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
        employeeCode: 'EMP-2026-001',
        specialization: 'Full-Stack Web Development',
        qualification: 'M.S. Computer Science',
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
        enrollmentNumber: 'STU-2026-001',
        academicYear: '2026',
      },
    });
    console.log('✅ Student created: student@apextech.com / password123');
  }

  // 6. Sample Course
  const courseTitle = 'Full-Stack Web Development Mastery';
  let course = await prisma.course.findFirst({ where: { title: courseTitle, instituteId: institute.id } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: courseTitle,
        description: 'Master modern frontend & backend skills using React, TypeScript, Express, and Prisma.',
        status: 'ACTIVE',
        instituteId: institute.id,
        teacherId: teacher.id,
      },
    });
    console.log('✅ Course created: Full-Stack Web Development Mastery');
  }

  // 7. Enrollment
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: course.id,
      },
    },
  });

  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
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
