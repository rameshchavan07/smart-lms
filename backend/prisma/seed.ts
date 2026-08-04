import prisma from '../src/config/db';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@openlearnx.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
      },
    });
    console.log('Super Admin user created: admin@openlearnx.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
