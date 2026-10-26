import type { NextFunction, Request, Response } from 'express';
import { Errors } from '../errors/AppError';
import { verifyAccessToken } from '../services/token.service';

// מאמת את ה-Bearer token ומצרף את req.user. כל כישלון מחזיר 401 אחיד.
export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(Errors.unauthorized());
    return;
  }
  try {
    req.user = verifyAccessToken(header.slice('Bearer '.length).trim());
    next();
  } catch (error) {
    next(error);
  }
}
