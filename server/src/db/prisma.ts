import { PrismaClient } from '@prisma/client';

// Prisma Client יחיד לכל האפליקציה
export const prisma = new PrismaClient();
