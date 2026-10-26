import jwt, { type SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { Errors } from '../errors/AppError';
import type { AuthUser } from '../types/dto';

interface AccessTokenClaims {
  sub: string;
  email: string;
  role: Role;
}

export function signAccessToken(user: AuthUser): string {
  const claims: AccessTokenClaims = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// זורק JsonWebTokenError / TokenExpiredError, שממופים ל-401 ב-errorHandler
export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof payload === 'string' || !payload.sub || !payload.email || !payload.role) {
    throw Errors.unauthorized();
  }
  const role = payload.role as Role;
  if (role !== Role.USER && role !== Role.ADMIN) {
    throw Errors.unauthorized();
  }
  return { id: payload.sub, email: String(payload.email), role };
}

// משך התוקף בשניות, לשדה expiresIn בתשובה. מחושב מתוך טוקן לדוגמה כדי להישאר נאמן ל-JWT_EXPIRES_IN.
export function getExpiresInSeconds(token: string): number {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded !== 'string' && decoded.exp && decoded.iat) {
    return decoded.exp - decoded.iat;
  }
  return 3600;
}
