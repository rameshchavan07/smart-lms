import * as dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/db';

async function main() {
  const institutes = await prisma.institute.findMany();
  if (institutes.length === 0) {
    console.log("No institutes found.");
    return;
  }
  
  console.log("Here are your URLs:");
  institutes.forEach((inst: any) => {
    console.log(`\nInstitute: ${inst.name}`);
    console.log(`Login URL: http://localhost:5173/i/${inst.slug}/login`);
    console.log(`Register URL: http://localhost:5173/i/${inst.slug}/register`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
