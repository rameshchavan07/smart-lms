import 'dotenv/config';
import prisma from './src/config/db';
import bcrypt from 'bcrypt';

async function main() {
  const institute = await prisma.institute.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Institute',
      slug: 'demo',
      email: 'demo@institute.com',
      status: 'APPROVED',
      isPrivate: false,
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: { passwordHash, isApproved: true, instituteId: institute.id, isEmailVerified: true },
    create: {
      firstName: 'Test',
      lastName: 'Student',
      email: 'student@demo.com',
      passwordHash,
      role: 'STUDENT',
      instituteId: institute.id,
      isEmailVerified: true,
      isApproved: true,
    }
  });
  
  console.log('Created Institute Code: demo');
  console.log('Created User Email: student@demo.com');
  console.log('Created User Password: password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
