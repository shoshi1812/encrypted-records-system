import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createAdmin, createRecord, registerUser, resetDatabase, type TestUser } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const FORBIDDEN_FIELDS = ['encryptedContent', 'nonce', 'passwordHash', 'ownerId', 'recipientId'];

function expectNoInternalFields(body: unknown) {
  const text = JSON.stringify(body);
  for (const field of FORBIDDEN_FIELDS) {
    expect(text).not.toContain(`"${field}"`);
  }
}

describe('Create and read', () => {
  // גרעין 7
  it('יצירת רשומה ושליפתה: התוכן חוזר זהה למה שנשלח', async () => {
    const owner = await registerUser();
    const recipient = await registerUser();
    const content = 'מספר החשבון הוא 12-345-6789\nשורה שנייה';

    const created = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({
        title: 'חוזה שכירות',
        description: 'טיוטה',
        recipientEmail: recipient.email.toUpperCase(),
        category: 'DOCUMENT',
        visibility: 'PRIVATE',
        content,
      });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      id: expect.any(String),
      title: 'חוזה שכירות',
      description: 'טיוטה',
      category: 'DOCUMENT',
      visibility: 'PRIVATE',
      createdAt: expect.any(String),
      senderEmail: owner.email,
    });
    expectNoInternalFields(created.body);

    const fetched = await api().get(`/api/cipher-records/${created.body.id}`).set(...bearer(owner));
    expect(fetched.status).toBe(200);
    expect(fetched.body.content).toBe(content);
    expect(fetched.body.recipientEmail).toBe(recipient.email);
    expectNoInternalFields(fetched.body);
  });

  // גרעין 8
  it('ownerId נקבע מהטוקן גם כשהלקוח שולח ערך אחר', async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const created = await createRecord(owner, { ownerId: other.id, senderEmail: other.email });
    const row = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.ownerId).toBe(owner.id);
    expect(created.senderEmail).toBe(owner.email);
  });

  // גרעין 9
  it('נמען שאינו קיים מחזיר 404 RECIPIENT_NOT_FOUND', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({ title: 't', recipientEmail: 'nobody@example.com', category: 'NOTE', content: 'x' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorCode: 'RECIPIENT_NOT_FOUND', message: 'לא ניתן לשלוח רשומה למשתמש המבוקש.' });
  });

  it('שליחה עצמית עובדת ו-description חסר מוחזר כ-null', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({ title: 'לעצמי', recipientEmail: owner.email, category: 'NOTE', content: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
    expect(res.body.visibility).toBe('PRIVATE');
  });

  it('הנמען מקבל את התוכן', async () => {
    const owner = await registerUser();
    const recipient = await registerUser();
    const created = await createRecord(owner, { recipientEmail: recipient.email, content: 'לנמען בלבד' });
    const res = await api().get(`/api/cipher-records/${created.id}`).set(...bearer(recipient));
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('לנמען בלבד');
  });

  it('content ארוך מ-20,000 תווים מחזיר 400 VALIDATION_ERROR ולא 413', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({ title: 't', recipientEmail: owner.email, category: 'NOTE', content: 'x'.repeat(20_001) });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'content' })]));

    const exact = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({ title: 't', recipientEmail: owner.email, category: 'NOTE', content: 'x'.repeat(20_000) });
    expect(exact.status).toBe(201);
  });

  it('גוף בקשה כבד מ-1mb מחזיר 413 PAYLOAD_TOO_LARGE במבנה האחיד', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ title: 't', recipientEmail: owner.email, category: 'NOTE', content: 'x'.repeat(1_100_000) }));
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ errorCode: 'PAYLOAD_TOO_LARGE', message: expect.any(String) });
  });

  it('ערכי enum לא מוכרים ושדות חובה חסרים מחזירים 400', async () => {
    const owner = await registerUser();
    const res = await api()
      .post('/api/cipher-records')
      .set(...bearer(owner))
      .send({ title: '', recipientEmail: owner.email, category: 'SECRET', visibility: 'HIDDEN' });
    expect(res.status).toBe(400);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'category', 'visibility', 'content']));
  });

  it('שליפה ישירה מהמסד מראה ש-encryptedContent אינו מכיל את הטקסט הגלוי', async () => {
    const owner = await registerUser();
    const content = 'PLAINTEXT-MARKER-מידע-רגיש';
    const created = await createRecord(owner, { content });
    const rows = await prisma.$queryRaw<{ encryptedContent: string; nonce: string }[]>`
      SELECT "encryptedContent", nonce FROM cipher_records WHERE id = ${created.id}::uuid`;
    expect(rows).toHaveLength(1);
    expect(rows[0].encryptedContent).not.toContain('PLAINTEXT-MARKER');
    expect(Buffer.from(rows[0].encryptedContent, 'base64').toString('utf8')).not.toContain('PLAINTEXT-MARKER');
    expect(Buffer.from(rows[0].nonce, 'base64')).toHaveLength(12);
  });
});

describe('Access rules (doc 02 section 6)', () => {
  let owner: TestUser;
  let recipient: TestUser;
  let third: TestUser;
  let admin: TestUser;

  beforeEach(async () => {
    owner = await registerUser('owner');
    recipient = await registerUser('recipient');
    third = await registerUser('third');
    admin = await createAdmin();
  });

  // גרעין 10
  it('משתמש שלישי ברשומה ציבורית מקבל content=null ו-recipientEmail=null', async () => {
    const created = await createRecord(owner, { recipientEmail: recipient.email, visibility: 'PUBLIC' });
    const res = await api().get(`/api/cipher-records/${created.id}`).set(...bearer(third));
    expect(res.status).toBe(200);
    expect(res.body.content).toBeNull();
    expect(res.body.recipientEmail).toBeNull();
    expect(res.body.title).toBe('רשומת בדיקה');
  });

  // גרעין 11
  it('רשומה פרטית מחזירה 404 למשתמש שלישי', async () => {
    const created = await createRecord(owner, { recipientEmail: recipient.email });
    const res = await api().get(`/api/cipher-records/${created.id}`).set(...bearer(third));
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('RECORD_NOT_FOUND');
  });

  it('מזהה שאינו קיים או אינו UUID מחזיר 404', async () => {
    const missing = await api().get('/api/cipher-records/00000000-0000-4000-8000-000000000000').set(...bearer(owner));
    expect(missing.status).toBe(404);
    const garbage = await api().get('/api/cipher-records/not-a-uuid').set(...bearer(owner));
    expect(garbage.status).toBe(404);
    expect(garbage.body.errorCode).toBe('RECORD_NOT_FOUND');
  });

  it('מנהל שאינו צד לרשומה רואה אותה בלי תוכן ובלי אימייל נמען', async () => {
    const created = await createRecord(owner, { recipientEmail: recipient.email });
    const res = await api().get(`/api/cipher-records/${created.id}`).set(...bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.content).toBeNull();
    expect(res.body.recipientEmail).toBeNull();
  });

  // גרעין 12
  it('נמען שמנסה לערוך מקבל 403', async () => {
    const created = await createRecord(owner, { recipientEmail: recipient.email });
    const res = await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(recipient))
      .send({ title: 'חטיפה', category: 'NOTE', visibility: 'PRIVATE', content: 'שונה' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorCode: 'FORBIDDEN', message: 'רק יוצר הרשומה רשאי לערוך אותה.' });
  });

  it('מנהל שאינו הבעלים ועורך מקבל 403', async () => {
    const created = await createRecord(owner, { recipientEmail: recipient.email });
    const res = await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(admin))
      .send({ title: 'x', category: 'NOTE', visibility: 'PRIVATE' });
    expect(res.status).toBe(403);
  });

  it('משתמש שלישי שעורך רשומה ציבורית מקבל 403, ורשומה פרטית 404', async () => {
    const pub = await createRecord(owner, { visibility: 'PUBLIC' });
    const priv = await createRecord(owner);
    const body = { title: 'x', category: 'NOTE', visibility: 'PRIVATE' };
    expect((await api().put(`/api/cipher-records/${pub.id}`).set(...bearer(third)).send(body)).status).toBe(403);
    expect((await api().put(`/api/cipher-records/${priv.id}`).set(...bearer(third)).send(body)).status).toBe(404);
  });

  it('רשימה: משתמש רגיל רואה שלו, שנשלחו אליו וציבוריות; מנהל רואה הכול', async () => {
    await createRecord(owner, { title: 'פרטית של הבעלים' });
    await createRecord(owner, { title: 'נשלחה לנמען', recipientEmail: recipient.email });
    await createRecord(owner, { title: 'ציבורית', visibility: 'PUBLIC' });
    await createRecord(third, { title: 'פרטית של השלישי' });

    const titles = async (user: TestUser) => {
      const res = await api().get('/api/cipher-records?pageSize=100').set(...bearer(user));
      expect(res.status).toBe(200);
      expectNoInternalFields(res.body);
      for (const item of res.body.items) {
        expect(item).not.toHaveProperty('content');
        expect(item).not.toHaveProperty('recipientEmail');
      }
      return res.body.items.map((i: { title: string }) => i.title).sort();
    };

    expect(await titles(recipient)).toEqual(['ציבורית', 'נשלחה לנמען'].sort());
    expect(await titles(third)).toEqual(['ציבורית', 'פרטית של השלישי'].sort());
    expect(await titles(admin)).toHaveLength(4);
  });
});

describe('Update', () => {
  // גרעין 13
  it('הבעלים מעדכן תוכן, ושליפה מחזירה את התוכן החדש', async () => {
    const owner = await registerUser();
    const created = await createRecord(owner, { content: 'תוכן ישן' });
    const res = await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(owner))
      .send({ title: 'כותרת חדשה', description: 'גרסה סופית', category: 'CODE', visibility: 'PUBLIC', content: 'תוכן חדש' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'כותרת חדשה', description: 'גרסה סופית', category: 'CODE', visibility: 'PUBLIC' });
    expect(res.body).not.toHaveProperty('content');
    expectNoInternalFields(res.body);

    const fetched = await api().get(`/api/cipher-records/${created.id}`).set(...bearer(owner));
    expect(fetched.body.content).toBe('תוכן חדש');
  });

  it('PUT עם content מחליף את ה-nonce ואת ה-ciphertext במסד', async () => {
    const owner = await registerUser();
    const created = await createRecord(owner);
    const before = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(owner))
      .send({ title: 't', category: 'NOTE', visibility: 'PRIVATE', content: 'חדש' });
    const after = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.nonce).not.toBe(before.nonce);
    expect(after.encryptedContent).not.toBe(before.encryptedContent);
  });

  it('PUT בלי content משאיר את התוכן ואת ה-nonce כפי שהיו', async () => {
    const owner = await registerUser();
    const created = await createRecord(owner, { content: 'נשאר' });
    const before = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    const res = await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(owner))
      .send({ title: 'מטא־נתונים בלבד', category: 'OTHER', visibility: 'PRIVATE' });
    expect(res.status).toBe(200);
    const after = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.nonce).toBe(before.nonce);
    expect(after.encryptedContent).toBe(before.encryptedContent);
    expect(after.title).toBe('מטא־נתונים בלבד');
    expect(after.description).toBe(before.description);
  });

  it('PUT אינו משנה את הבעלים ואת הנמען', async () => {
    const owner = await registerUser();
    const recipient = await registerUser();
    const other = await registerUser();
    const created = await createRecord(owner, { recipientEmail: recipient.email });
    const res = await api()
      .put(`/api/cipher-records/${created.id}`)
      .set(...bearer(owner))
      .send({ title: 't', category: 'NOTE', visibility: 'PRIVATE', ownerId: other.id, recipientId: other.id, recipientEmail: other.email });
    expect(res.status).toBe(200);
    const row = await prisma.cipherRecord.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.ownerId).toBe(owner.id);
    expect(row.recipientId).toBe(recipient.id);
  });

  it('description ריק או null מנקה את השדה', async () => {
    const owner = await registerUser();
    for (const description of [null, '']) {
      const created = await createRecord(owner, { description: 'יש תיאור' });
      const res = await api()
        .put(`/api/cipher-records/${created.id}`)
        .set(...bearer(owner))
        .send({ title: 't', description, category: 'NOTE', visibility: 'PRIVATE' });
      expect(res.status).toBe(200);
      expect(res.body.description).toBeNull();
    }
  });

  it('content ריק או ארוך מ-20,000 תווים בעריכה מחזיר 400', async () => {
    const owner = await registerUser();
    const created = await createRecord(owner);
    for (const content of ['', 'x'.repeat(20_001)]) {
      const res = await api()
        .put(`/api/cipher-records/${created.id}`)
        .set(...bearer(owner))
        .send({ title: 't', category: 'NOTE', visibility: 'PRIVATE', content });
      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    }
  });
});

describe('List: search, filter, sort, paging', () => {
  it('חיפוש לא תלוי רישיות, סינון קטגוריה, מיון ו-totalCount', async () => {
    const owner = await registerUser();
    await createRecord(owner, { title: 'Alpha contract', category: 'DOCUMENT' });
    await createRecord(owner, { title: 'beta notes', category: 'NOTE' });
    await createRecord(owner, { title: 'ALPHA code', category: 'CODE' });

    const search = await api().get('/api/cipher-records?search=alpha').set(...bearer(owner));
    expect(search.body.totalCount).toBe(2);

    const filtered = await api().get('/api/cipher-records?search=alpha&category=CODE').set(...bearer(owner));
    expect(filtered.body.totalCount).toBe(1);
    expect(filtered.body.items[0].title).toBe('ALPHA code');

    const asc = await api().get('/api/cipher-records?sortDirection=ASC').set(...bearer(owner));
    const desc = await api().get('/api/cipher-records').set(...bearer(owner));
    expect(asc.body.items.map((i: { id: string }) => i.id)).toEqual(
      [...desc.body.items.map((i: { id: string }) => i.id)].reverse(),
    );

    const page2 = await api().get('/api/cipher-records?pageSize=2&page=2').set(...bearer(owner));
    expect(page2.body).toMatchObject({ page: 2, pageSize: 2, totalCount: 3 });
    expect(page2.body.items).toHaveLength(1);
  });

  it('pageSize מעל 100 נדחה ב-400', async () => {
    const owner = await registerUser();
    const res = await api().get('/api/cipher-records?pageSize=101').set(...bearer(owner));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
