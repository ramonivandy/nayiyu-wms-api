import { PrismaClient } from '@prisma/client';
import { isDevelopment } from '../config';

// Create a singleton instance of Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (isDevelopment) globalThis.prisma = prisma;