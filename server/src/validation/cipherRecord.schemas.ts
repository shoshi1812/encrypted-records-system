import { Category, Visibility } from '@prisma/client';
import { z } from 'zod';
import { emailField } from './common';

export const CONTENT_MAX_LENGTH = 20_000;

const title = z
  .string({ required_error: 'כותרת היא שדה חובה' })
  .trim()
  .min(1, 'כותרת היא שדה חובה')
  .max(150, 'הכותרת יכולה להכיל עד 150 תווים');

// מחרוזת ריקה או null מנקים את התיאור
const description = z
  .string()
  .trim()
  .max(300, 'התיאור יכול להכיל עד 300 תווים')
  .nullable()
  .transform((value) => (value ? value : null));

const content = z
  .string({ required_error: 'תוכן הוא שדה חובה' })
  .min(1, 'תוכן הוא שדה חובה')
  .max(CONTENT_MAX_LENGTH, `התוכן יכול להכיל עד ${CONTENT_MAX_LENGTH} תווים`);

const category = z.nativeEnum(Category, { errorMap: () => ({ message: 'קטגוריה אינה תקינה' }) });
const visibility = z.nativeEnum(Visibility, { errorMap: () => ({ message: 'ערך חשיפה אינו תקין' }) });

export const createCipherRecordSchema = z.object({
  title,
  description: description.optional().transform((value) => value ?? null),
  recipientEmail: emailField,
  category,
  visibility: visibility.default(Visibility.PRIVATE),
  content,
});

// חמשת השדות הניתנים לעריכה. שדות אחרים (ownerId, recipientId, recipientEmail) מושמטים בשקט.
// description שלא נשלח נשאר כפי שהוא; null או מחרוזת ריקה מנקים אותו.
export const updateCipherRecordSchema = z.object({
  title,
  description: description.optional(),
  category,
  visibility,
  content: content.optional(),
});

export const listCipherRecordsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  category: category.optional(),
  sortDirection: z.enum(['ASC', 'DESC']).default('DESC'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100, 'pageSize מוגבל ל-100').default(20),
});

// מזהה שאינו UUID תקין מטופל כרשומה שאינה קיימת (404), כמו כל מזהה לא קיים
export const recordIdSchema = z.string().uuid();

export type CreateCipherRecordInput = z.infer<typeof createCipherRecordSchema>;
export type UpdateCipherRecordInput = z.infer<typeof updateCipherRecordSchema>;
export type ListCipherRecordsQuery = z.infer<typeof listCipherRecordsQuerySchema>;
