import { afterAll, describe, expect, it } from 'vitest';
import openapi from '../src/docs/openapi.json';
import { prisma } from '../src/db/prisma';
import { api, bearer, registerUser, resetDatabase } from './helpers';

afterAll(() => prisma.$disconnect());

describe('Infrastructure', () => {
  it('GET /api/health מחזיר 200', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api-docs מחזיר 200', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('openapi.json מכיל את כל תשעת הנתיבים ואת ה-securityScheme', () => {
    const operations = Object.entries(openapi.paths).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(operations.sort()).toEqual(
      [
        'GET /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'GET /api/cipher-records',
        'POST /api/cipher-records',
        'GET /api/cipher-records/{id}',
        'PUT /api/cipher-records/{id}',
        'GET /api/admin/users',
      ].sort(),
    );
    expect(openapi.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
    const text = JSON.stringify(openapi);
    expect(text).not.toContain('encryptedContent');
    expect(text).not.toContain('nonce');
  });

  it('נתיב לא מוכר מחזיר 404 ROUTE_NOT_FOUND', async () => {
    const res = await api().get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('ROUTE_NOT_FOUND');
  });

  it('JSON פגום מחזיר 400 במבנה האחיד', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('אין DELETE על רשומות', async () => {
    await resetDatabase();
    const user = await registerUser();
    const res = await api().delete('/api/cipher-records/00000000-0000-4000-8000-000000000000').set(...bearer(user));
    expect(res.status).toBe(404);
  });
});
