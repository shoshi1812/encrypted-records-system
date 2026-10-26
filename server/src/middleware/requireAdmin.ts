import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { Errors } from '../errors/AppError';

// מוחל אחרי auth. משתמש רגיל מקבל 403.
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }
  if (req.user.role !== Role.ADMIN) {
    next(Errors.adminOnly());
    return;
  }
  next();
}
