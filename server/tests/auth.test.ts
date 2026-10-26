import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createAdmin, registerUser, resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('Auth', () => {
  // גרעין 1
  it('הרשמה תקינה מחזירה 201, טוקן ומשתמש USER', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'Dana@Example.com', password: 'Example123', role: 'ADMIN', confirmPassword: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.expiresIn).toBe(3600);
    expect(res.body.user).toEqual({ id: expect.any(String), email: 'dana@example.com', role: 'USER' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  // גרעין 2
  it('אימייל כפול מחזיר 409, גם ברישיות שונות', async () => {
    await api().post('/api/auth/register').send({ email: 'dup@example.com', password: 'Example123' });
    const res = await api().post('/api/auth/register').send({ email: 'DUP@example.com', password: 'Example123' });
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('סיסמה חלשה מחזירה 400', async () => {
    for (const password of ['short1', 'onlyletters', '12345678']) {
      const res = await api().post('/api/auth/register').send({ email: 'weak@example.com', password });
      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    }
  });

  // גרעין 3
  it('Login תקין מחזיר 200 עם טוקן ומשתמש', async () => {
    await api().post('/api/auth/register').send({ email: 'login@example.com', password: 'Example123' });
    const res = await api().post('/api/auth/login').send({ email: 'LOGIN@example.com', password: 'Example123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('login@example.com');
  });

  // גרעין 4
  it('סיסמה שגויה ואימייל שאינו קיים מחזירים אותה תשובה בדיוק', async () => {
    await api().post('/api/auth/register').send({ email: 'exists@example.com', password: 'Example123' });
    const wrongPassword = await api().post('/api/auth/login').send({ email: 'exists@example.com', password: 'Wrong1234' });
    const noSuchUser = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Wrong1234' });
    expect(wrongPassword.status).toBe(401);
    expect(noSuchUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(noSuchUser.body);
    expect(wrongPassword.body).toEqual({ errorCode: 'INVALID_CREDENTIALS', message: 'אימייל או סיסמה שגויים.' });
  });

  // גרעין 5
  it('בקשה ללא טוקן מחזירה 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('טוקן פגום או שפג תוקפו מחזיר 401', async () => {
    const malformed = await api().get('/api/cipher-records').set('Authorization', 'Bearer not-a-token');
    expect(malformed.status).toBe(401);

    const user = await registerUser();
    const expired = jwt.sign({ sub: user.id, email: user.email, role: 'USER' }, process.env.JWT_SECRET!, {
      expiresIn: -10,
    });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');

    const forged = jwt.sign({ sub: user.id, email: user.email, role: 'ADMIN' }, 'some-other-secret');
    const forgedRes = await api().get('/api/admin/users').set('Authorization', `Bearer ${forged}`);
    expect(forgedRes.status).toBe(401);
  });

  it('GET /api/auth/me מחזיר את המשתמש לפי הטוקן', async () => {
    const user = await registerUser();
    const res = await api().get('/api/auth/me').set(...bearer(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: user.id, email: user.email, role: 'USER' });
  });
});

describe('Admin', () => {
  // גרעין 6
  it('משתמש רגיל פונה ל-/api/admin/users ומקבל 403', async () => {
    const user = await registerUser();
    const res = await api().get('/api/admin/users').set(...bearer(user));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorCode: 'FORBIDDEN', message: 'הפעולה מותרת למנהל בלבד.' });
  });

  it('מנהל מקבל 200 עם רשימת משתמשים ללא passwordHash', async () => {
    await registerUser();
    const admin = await createAdmin();
    const res = await api().get('/api/admin/users').set(...bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    for (const user of res.body) {
      expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'role']);
    }
  });
});
