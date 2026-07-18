import 'dotenv/config';
import prisma from './src/config/db';

async function main() {
  const inst = await prisma.institute.findUnique({ where: { slug: 'demo' } });
  console.log('Institute:', inst);
  const user = await prisma.user.findUnique({ where: { email: 'student@demo.com' } });
  console.log('User:', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
