import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';

afterAll(() => prisma.$disconnect());

describe('Rate limit', () => {
  // ה-limiter מושבת בסביבת בדיקות, ולכן מופעל כאן במפורש
  it('חריגה מהגבלת ניסיונות ההתחברות מחזירה 429', async () => {
    const app = createApp({ enableAuthRateLimit: true });
    let last = 0;
    let body: unknown;
    for (let i = 0; i < 21; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });
      last = res.status;
      body = res.body;
    }
    expect(last).toBe(429);
    expect(body).toEqual({ errorCode: 'TOO_MANY_REQUESTS', message: expect.any(String) });
  });
});
