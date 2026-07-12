import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prismaClient = new PrismaClient({ adapter });

const softDeleteModels = ['Institute', 'User', 'Course'];

const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
        }
        return query(args);
      },
      async findFirstOrThrow({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
        }
        return query(args);
      },
      async aggregate({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
        }
        return query(args);
      },
      async delete({ model, args, query }): Promise<any> {
        if (softDeleteModels.includes(model)) {
          return (prismaClient as any)[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async deleteMany({ model, args, query }): Promise<any> {
        if (softDeleteModels.includes(model)) {
          return (prismaClient as any)[model].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          const result = await query(args);
          if (result && (result as any).deletedAt) return null;
          return result;
        }
        return query(args);
      },
      async findUniqueOrThrow({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          const result = await query(args);
          if (result && (result as any).deletedAt) throw new Error(`${model} not found`);
          return result;
        }
        return query(args);
      },
    },
  },
});

export default prisma;
