import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { health } from './controllers/health.controller';
import { swaggerRouter } from './docs/swagger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { createAuthRateLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';

interface AppOptions {
  // בדיקת ה-429 מפעילה את ה-limiter במפורש גם בסביבת בדיקות
  enableAuthRateLimit?: boolean;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const enableRateLimit = options.enableAuthRateLimit ?? env.NODE_ENV !== 'test';

  app.set('trust proxy', 1);

  // 1. helmet. ה-CSP הגלובלי מוגדר בנפרד כדי שנתיב /api-docs יוכל להגדיר CSP משלו.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs')) return next();
    return helmet.contentSecurityPolicy()(req, res, next);
  });

  // 2. CORS לכתובת הקליינט בלבד
  app.use(cors({ origin: env.CLIENT_ORIGIN.replace(/\/$/, '') }));

  // 3. גוף JSON עד 1mb. חריגה ממופה ל-413 ב-errorHandler
  app.use(express.json({ limit: '1mb' }));

  // לוג בקשות בפיתוח בלבד: method, path וסטטוס, ללא גוף הבקשה
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // 4. הגבלת ניסיונות על נתיבי האימות, מושבתת בבדיקות
  if (enableRateLimit) {
    app.use('/api/auth', createAuthRateLimiter());
  }

  // 5. בדיקת בריאות
  app.get('/api/health', health);

  // 6. Swagger
  app.use('/api-docs', swaggerRouter);

  // 7. נתיבי ה-API
  app.use('/api', apiRouter);

  // 8-9
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
