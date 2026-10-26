import type { NextFunction, Request, RequestHandler, Response } from 'express';

// עוטף handler אסינכרוני כך שכל שגיאה מגיעה ל-error middleware
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
