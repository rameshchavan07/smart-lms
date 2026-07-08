const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.institute.findMany().then(console.log).finally(() => prisma.$disconnect());
