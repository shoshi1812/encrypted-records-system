import { Prisma, Role, Visibility } from '@prisma/client';
import { decryptText, encryptText } from '../crypto';
import { prisma } from '../db/prisma';
import { Errors } from '../errors/AppError';
import type {
  AuthUser,
  CipherRecordDetailsDto,
  CipherRecordListItemDto,
  CipherRecordPageDto,
} from '../types/dto';
import {
  recordIdSchema,
  type CreateCipherRecordInput,
  type ListCipherRecordsQuery,
  type UpdateCipherRecordInput,
} from '../validation/cipherRecord.schemas';

// מטא־נתונים בלבד. encryptedContent ו-nonce אינם נשלפים ברשימה.
const listItemSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  visibility: true,
  createdAt: true,
  owner: { select: { email: true } },
} satisfies Prisma.CipherRecordSelect;

type ListItemRow = Prisma.CipherRecordGetPayload<{ select: typeof listItemSelect }>;

function toListItemDto(row: ListItemRow): CipherRecordListItemDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    category: row.category,
    visibility: row.visibility,
    createdAt: row.createdAt.toISOString(),
    senderEmail: row.owner.email,
  };
}

/** תנאי הנראות לרשימה. משתמש רגיל: שלו, שנשלחו אליו, וציבוריות. מנהל: הכול. */
function visibleToWhere(user: AuthUser): Prisma.CipherRecordWhereInput {
  if (user.role === Role.ADMIN) {
    return {};
  }
  return {
    OR: [{ ownerId: user.id }, { recipientId: user.id }, { visibility: Visibility.PUBLIC }],
  };
}

/**
 * טבלת ההכרעה ממסמך 02 סעיף 6:
 * - צד לרשומה (בעלים או נמען): רואה, ומקבל תוכן.
 * - מנהל, או כל משתמש ברשומה PUBLIC: רואה את קיומה, בלי תוכן.
 * - אחרת: אינו רשאי לדעת שהיא קיימת (404).
 */
function resolveAccess(
  user: AuthUser,
  record: { ownerId: string; recipientId: string; visibility: Visibility },
) {
  const isOwner = record.ownerId === user.id;
  const isParty = isOwner || record.recipientId === user.id;
  const canSee = isParty || user.role === Role.ADMIN || record.visibility === Visibility.PUBLIC;
  return { isOwner, isParty, canSee };
}

function assertValidId(id: string): void {
  if (!recordIdSchema.safeParse(id).success) {
    throw Errors.recordNotFound();
  }
}

export async function listRecords(
  user: AuthUser,
  query: ListCipherRecordsQuery,
): Promise<CipherRecordPageDto> {
  const where: Prisma.CipherRecordWhereInput = {
    AND: [
      visibleToWhere(user),
      query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {},
      query.category ? { category: query.category } : {},
    ],
  };

  const [totalCount, rows] = await prisma.$transaction([
    prisma.cipherRecord.count({ where }),
    prisma.cipherRecord.findMany({
      where,
      select: listItemSelect,
      orderBy: [{ createdAt: query.sortDirection === 'ASC' ? 'asc' : 'desc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map(toListItemDto),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
  };
}

export async function createRecord(
  user: AuthUser,
  input: CreateCipherRecordInput,
): Promise<CipherRecordListItemDto> {
  const recipient = await prisma.user.findUnique({
    where: { email: input.recipientEmail },
    select: { id: true },
  });
  if (!recipient) {
    throw Errors.recipientNotFound();
  }

  const { encryptedContent, nonce } = encryptText(input.content);

  const created = await prisma.cipherRecord.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      visibility: input.visibility,
      ownerId: user.id, // תמיד מהטוקן
      recipientId: recipient.id,
      encryptedContent,
      nonce,
    },
    select: listItemSelect,
  });

  return toListItemDto(created);
}

export async function getRecord(user: AuthUser, id: string): Promise<CipherRecordDetailsDto> {
  assertValidId(id);

  const record = await prisma.cipherRecord.findUnique({
    where: { id },
    select: {
      ...listItemSelect,
      ownerId: true,
      recipientId: true,
      recipient: { select: { email: true } },
    },
  });
  if (!record) {
    throw Errors.recordNotFound();
  }

  // הכרעת ההרשאה קודמת לשליפת ה-ciphertext ולפענוח
  const access = resolveAccess(user, record);
  if (!access.canSee) {
    throw Errors.recordNotFound();
  }

  const base = toListItemDto(record);
  if (!access.isParty) {
    return { ...base, recipientEmail: null, content: null };
  }

  const secret = await prisma.cipherRecord.findUnique({
    where: { id },
    select: { encryptedContent: true, nonce: true },
  });
  if (!secret) {
    throw Errors.recordNotFound();
  }

  let content: string;
  try {
    content = decryptText(secret.encryptedContent, secret.nonce);
  } catch {
    // נרשם ללא תוכן, ciphertext או מפתח
    console.error(`Decryption failed for cipher record ${id}`);
    throw Errors.internal();
  }

  return { ...base, recipientEmail: record.recipient.email, content };
}

export async function updateRecord(
  user: AuthUser,
  id: string,
  input: UpdateCipherRecordInput,
): Promise<CipherRecordListItemDto> {
  assertValidId(id);

  const existing = await prisma.cipherRecord.findUnique({
    where: { id },
    select: { ownerId: true, recipientId: true, visibility: true },
  });
  if (!existing) {
    throw Errors.recordNotFound();
  }

  const access = resolveAccess(user, existing);
  if (!access.canSee) {
    throw Errors.recordNotFound();
  }
  if (!access.isOwner) {
    throw Errors.ownerOnly();
  }

  const data: Prisma.CipherRecordUpdateInput = {
    title: input.title,
    category: input.category,
    visibility: input.visibility,
  };
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.content !== undefined) {
    // הצפנה חדשה עם nonce חדש. שתי העמודות מוחלפות יחד באותה פעולת update.
    const { encryptedContent, nonce } = encryptText(input.content);
    data.encryptedContent = encryptedContent;
    data.nonce = nonce;
  }

  const updated = await prisma.cipherRecord.update({
    where: { id },
    data,
    select: listItemSelect,
  });

  return toListItemDto(updated);
}
