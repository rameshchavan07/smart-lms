import * as dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/db';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      student: { select: { id: true } },
      teacher: { select: { id: true } },
    }
  });
  console.log(users);
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
