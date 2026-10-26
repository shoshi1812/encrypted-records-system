import request from 'supertest';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';

export const app = createApp();
export const api = () => request(app);

export async function resetDatabase(): Promise<void> {
  await prisma.cipherRecord.deleteMany();
  await prisma.user.deleteMany();
}

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

let counter = 0;

export async function registerUser(prefix = 'user'): Promise<TestUser> {
  counter += 1;
  const email = `${prefix}${counter}@example.com`;
  const res = await api().post('/api/auth/register').send({ email, password: 'Password123' });
  if (res.status !== 201) throw new Error(`register failed: ${res.status}`);
  return { id: res.body.user.id, email, token: res.body.accessToken };
}

// מנהל נוצר ישירות במסד, כמו ב-Seed. אין דרך ליצור מנהל דרך ה-API.
export async function createAdmin(): Promise<TestUser> {
  counter += 1;
  const email = `admin${counter}@example.com`;
  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash('Password123', 10), role: Role.ADMIN },
  });
  const res = await api().post('/api/auth/login').send({ email, password: 'Password123' });
  return { id: user.id, email, token: res.body.accessToken };
}

export function bearer(user: TestUser): [string, string] {
  return ['Authorization', `Bearer ${user.token}`];
}

export async function createRecord(
  owner: TestUser,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; [key: string]: unknown }> {
  const res = await api()
    .post('/api/cipher-records')
    .set(...bearer(owner))
    .send({
      title: 'רשומת בדיקה',
      description: 'תיאור',
      recipientEmail: owner.email,
      category: 'NOTE',
      visibility: 'PRIVATE',
      content: 'תוכן סודי לבדיקה',
      ...overrides,
    });
  if (res.status !== 201) throw new Error(`create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}
