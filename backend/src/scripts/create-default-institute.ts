import prisma from '../config/db';

async function main() {
  // 1. Check if the default institute already exists
  let defaultInstitute = await prisma.institute.findFirst({
    where: { name: 'Global Institute' }
  });

  // 2. Create if it doesn't exist
  if (!defaultInstitute) {
    defaultInstitute = await prisma.institute.create({
      data: {
        name: 'Global Institute',
        slug: 'global',
        email: 'global@example.com',
        status: 'APPROVED',
        address: 'System Default Address',
      }
    });
    console.log('Created Default Institute:', defaultInstitute.id);
  } else {
    console.log('Default Institute already exists:', defaultInstitute.id);
  }

  // 3. Assign all users to the default institute
  const updateUsers = await prisma.user.updateMany({
    where: { instituteId: null },
    data: { instituteId: defaultInstitute.id }
  });
  console.log(`Assigned ${updateUsers.count} users to Default Institute`);

  // 4. Assign all courses to the default institute
  const updateCourses = await prisma.course.updateMany({
    where: { instituteId: null },
    data: { instituteId: defaultInstitute.id }
  });
  console.log(`Assigned ${updateCourses.count} courses to Default Institute`);
}

main()
  .catch(e => {
    console.error(e);
    // Removed process.exit to avoid TS error
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
