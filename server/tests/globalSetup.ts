import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';

// מריץ את המיגרציות על מסד הבדיקות לפני כל הרצה
export default function setup(): void {
  const parsed = loadEnv({ path: '.env.test', override: true }).parsed;
  if (!parsed?.DATABASE_URL) {
    throw new Error('חסר קובץ .env.test עם DATABASE_URL של מסד בדיקות נפרד. ראי .env.test.example');
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: parsed.DATABASE_URL },
  });
}
