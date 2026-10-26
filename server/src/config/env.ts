import 'dotenv/config';
import { z } from 'zod';

const base64Key = z
  .string()
  .min(1, 'ENCRYPTION_KEY חסר')
  .refine((value) => /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0, {
    message: 'ENCRYPTION_KEY אינו מחרוזת Base64 תקינה',
  })
  .refine((value) => Buffer.from(value, 'base64').length === 32, {
    message: 'ENCRYPTION_KEY חייב להיות 32 בתים בדיוק לאחר פענוח Base64',
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL חסר'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET חסר'),
  JWT_EXPIRES_IN: z.string().min(1).default('60m'),
  ENCRYPTION_KEY: base64Key,
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().min(1, 'CLIENT_ORIGIN חסר'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_USER_EMAIL: z.string().email().optional(),
  SEED_USER_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // כשל מוקדם וברור בעליית השרת. הערכים עצמם אינם מודפסים.
    console.error(`הגדרות הסביבה אינן תקינות:\n${problems}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
