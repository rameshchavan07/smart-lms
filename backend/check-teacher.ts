/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'TEACHER' }
  });
  console.log(users.length);
}
main().then(() => process.exit(0));
