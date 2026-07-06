const prisma = require('./dist/config/db').default;
const bcrypt = require('bcrypt');

async function testCreate() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Teacher',
        email: `test${Date.now()}@test.com`,
        passwordHash,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeCode: `EMP${Date.now()}`,
            specialization: 'Math',
            joiningDate: new Date()
          }
        }
      },
      include: { teacher: true }
    });
    console.log('Teacher created:', user.email);
  } catch (err) {
    console.error('Error creating teacher:', err);
  }
}

testCreate().finally(() => prisma.$disconnect());
