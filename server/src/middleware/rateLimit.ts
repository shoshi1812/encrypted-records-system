import rateLimit, { type Options } from 'express-rate-limit';

const MESSAGE = { errorCode: 'TOO_MANY_REQUESTS', message: 'יותר מדי ניסיונות. נסי שוב בעוד מספר דקות.' };

export function createAuthRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json(MESSAGE);
    },
    ...overrides,
  });
}
