import type { Request, Response } from 'express';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ errorCode: 'ROUTE_NOT_FOUND', message: 'הנתיב המבוקש אינו קיים.' });
}
