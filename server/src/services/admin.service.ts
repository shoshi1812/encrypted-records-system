import { prisma } from '../db/prisma';
import type { AdminUserDto } from '../types/dto';

export async function listUsers(): Promise<AdminUserDto[]> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  // passwordHash אינו נשלף כלל
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));
}
