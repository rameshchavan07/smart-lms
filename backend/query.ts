import prisma from './src/config/db';
async function main() {
  const institutes = await prisma.institute.findMany();
  console.log('Institutes:', JSON.stringify(institutes, null, 2));
}
main().catch(console.error).finally(() => process.exit(0));
