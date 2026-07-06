import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'xdrutu123@gmail.com';
  
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    await prisma.user.update({
      where: { email },
      data: { 
        role: 'SUPER_ADMIN',
        instituteId: null, // Super admins might not need an institute, they oversee all
        passwordHash
      }
    });
    console.log(`Successfully updated ${email} to SUPER_ADMIN role.`);
  } else {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await prisma.user.create({
      data: {
        email,
        firstName: 'Super',
        lastName: 'Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });
    console.log(`User ${email} did not exist. Created a new SUPER_ADMIN account with password: admin123`);
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
