import * as dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/db';

async function main() {
  // Find users who have a student or teacher record but instituteId is null
  const orphanedUsers = await prisma.user.findMany({
    where: {
      instituteId: null,
      role: { in: ['TEACHER', 'STUDENT'] }
    }
  });

  if (orphanedUsers.length > 0) {
    // Assuming there's only one institute in this environment (concept-simplified)
    const institute = await prisma.institute.findUnique({
      where: { slug: 'concept-simplified' }
    });
    
    if (institute) {
      for (const user of orphanedUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { instituteId: institute.id }
        });
        console.log(`Restored user ${user.email} to institute ${institute.name}`);
      }
    }
  } else {
    console.log('No orphaned users found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
