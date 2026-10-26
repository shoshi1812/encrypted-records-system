import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';

// מסד נתונים נפרד ו-ENCRYPTION_KEY נפרד לבדיקות, מתוך .env.test
const testEnv = loadEnv({ path: '.env.test', override: true }).parsed ?? {};

export default defineConfig({
  test: {
    environment: 'node',
    env: { ...testEnv, NODE_ENV: 'test' },
    globalSetup: ['./tests/globalSetup.ts'],
    include: ['tests/**/*.test.ts'],
    // כל הקבצים חולקים מסד אחד, לכן רצים בזה אחר זה
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
