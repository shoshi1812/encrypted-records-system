import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

// אחרון ב-pipeline. תמיד מחזיר { errorCode, message } ולעולם לא stack.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ errorCode: err.errorCode, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      errorCode: 'VALIDATION_ERROR',
      message: 'הנתונים שנשלחו אינם תקינים.',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ errorCode: 'EMAIL_ALREADY_EXISTS', message: 'כתובת האימייל כבר רשומה במערכת.' });
    return;
  }

  // TokenExpiredError יורש מ-JsonWebTokenError, אבל נבדק במפורש לבהירות
  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    res.status(401).json({ errorCode: 'UNAUTHORIZED', message: 'נדרשת התחברות.' });
    return;
  }

  const bodyError = err as BodyParserError;
  if (bodyError?.type === 'entity.too.large') {
    res.status(413).json({ errorCode: 'PAYLOAD_TOO_LARGE', message: 'גוף הבקשה גדול מהמותר (1mb).' });
    return;
  }
  if (bodyError?.type === 'entity.parse.failed') {
    res.status(400).json({ errorCode: 'VALIDATION_ERROR', message: 'גוף הבקשה אינו JSON תקין.', details: [] });
    return;
  }

  // ה-stack נרשם ללוג השרת בלבד ואינו נשלח ללקוח
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ errorCode: 'INTERNAL_ERROR', message: 'אירעה שגיאה פנימית בשרת.' });
}
