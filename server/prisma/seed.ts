/**
 * Seed לפיתוח ולהדגמה בלבד.
 * אזהרה: מוחק את כל הרשומות במסד בכל הרצה.
 *
 * סדר קשיח:
 * 1. deleteMany על cipher_records. לטבלה אין שדה ייחודי ל-upsert, ובלי המחיקה הרצה שנייה מכפילה רשומות.
 *    המחיקה קודמת למשתמשים כי onDelete הוא Restrict.
 * 2. upsert לפי email על שני המשתמשים.
 * 3. יצירת רשומות הדוגמה, עם אותה encryptText שהשרת משתמש בה.
 */
import bcrypt from 'bcrypt';
import { Category, PrismaClient, Role, Visibility } from '@prisma/client';
import { env } from '../src/config/env';
import { encryptText } from '../src/crypto';

const prisma = new PrismaClient();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} חסר ב-.env. ה-Seed זקוק לו.`);
  }
  return value;
}

async function upsertUser(email: string, password: string, role: Role) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role },
    create: { email: email.toLowerCase(), passwordHash, role },
  });
}

async function main() {
  const adminEmail = required('SEED_ADMIN_EMAIL', env.SEED_ADMIN_EMAIL);
  const adminPassword = required('SEED_ADMIN_PASSWORD', env.SEED_ADMIN_PASSWORD);
  const userEmail = required('SEED_USER_EMAIL', env.SEED_USER_EMAIL);
  const userPassword = required('SEED_USER_PASSWORD', env.SEED_USER_PASSWORD);

  // 1
  await prisma.cipherRecord.deleteMany();

  // 2
  const admin = await upsertUser(adminEmail, adminPassword, Role.ADMIN);
  const user = await upsertUser(userEmail, userPassword, Role.USER);

  // 3. נתונים מומצאים בלבד
  const records = [
    {
      title: 'סיסמת הנתב בבית',
      description: 'פרטי גישה לרשת הביתית',
      ownerId: user.id,
      recipientId: user.id,
      category: Category.NOTE,
      visibility: Visibility.PRIVATE,
      content: 'שם הרשת: Home-5G, סיסמה: Example-Pass-2026',
    },
    {
      title: 'הנחיות לשימוש במערכת',
      description: null,
      ownerId: user.id,
      recipientId: admin.id,
      category: Category.DOCUMENT,
      visibility: Visibility.PUBLIC,
      content: 'יש להתחבר עם האימייל האישי, ליצור רשומה ולבחור נמען אחד בלבד.',
    },
    {
      title: 'מפתח API לסביבת בדיקות',
      description: 'נשלח למנהל לצורך הגדרת השרת',
      ownerId: user.id,
      recipientId: admin.id,
      category: Category.CODE,
      visibility: Visibility.PRIVATE,
      content: 'TEST_API_KEY=demo-1234-abcd-5678',
    },
    {
      title: 'חוזה שכירות לחתימה',
      description: null,
      ownerId: admin.id,
      recipientId: user.id,
      category: Category.DOCUMENT,
      visibility: Visibility.PRIVATE,
      content: 'מספר החשבון לתשלום הוא 12-345-6789',
    },
    {
      title: 'הערות פנימיות של המנהל',
      description: 'רשומה שהמשתמש הרגיל אינו צד לה',
      ownerId: admin.id,
      recipientId: admin.id,
      category: Category.OTHER,
      visibility: Visibility.PRIVATE,
      content: 'תזכורת: לבדוק את גיבויי המסד בסוף החודש.',
    },
  ];

  for (const { content, ...record } of records) {
    await prisma.cipherRecord.create({ data: { ...record, ...encryptText(content) } });
  }

  console.log(`Seed completed: 2 users, ${records.length} records.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
