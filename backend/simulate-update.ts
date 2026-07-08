require('dotenv').config();
import prisma from './src/config/db';

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  console.log('Teacher before:', teacher?.id, teacher?.role);

  // simulate updateUser logic
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: teacher!.id },
      data: { role: 'STUDENT' }
    });
    await tx.student.upsert({
      where: { userId: teacher!.id },
      update: {},
      create: { userId: teacher!.id, enrollmentNumber: 'ENR-123', academicYear: '2026', admissionDate: new Date() }
    });
  });

  const updated = await prisma.user.findUnique({ where: { id: teacher!.id } });
  console.log('User after:', updated?.id, updated?.role);

  const allUsers = await prisma.user.findMany({
    where: { instituteId: admin!.instituteId }
  });
  console.log('Is user in allUsers?', allUsers.some(u => u.id === teacher!.id));

  // revert
  await prisma.user.update({
    where: { id: teacher!.id },
    data: { role: 'TEACHER' }
  });
}
main().then(() => process.exit(0));
