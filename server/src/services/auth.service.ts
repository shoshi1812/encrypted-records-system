import bcrypt from 'bcrypt';
import { Prisma, Role, type User } from '@prisma/client';
import { prisma } from '../db/prisma';
import { Errors } from '../errors/AppError';
import type { AuthResponseDto, UserDto } from '../types/dto';
import type { LoginInput, RegisterInput } from '../validation/auth.schemas';
import { getExpiresInSeconds, signAccessToken } from './token.service';

const BCRYPT_COST = 10;

// hash קבוע להשוואה כשהאימייל אינו קיים, כדי שזמן התגובה לא יסגיר את קיומו
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

function toUserDto(user: Pick<User, 'id' | 'email' | 'role'>): UserDto {
  return { id: user.id, email: user.email, role: user.role };
}

function buildAuthResponse(user: Pick<User, 'id' | 'email' | 'role'>): AuthResponseDto {
  const dto = toUserDto(user);
  const accessToken = signAccessToken(dto);
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: getExpiresInSeconds(accessToken),
    user: dto,
  };
}

export async function register(input: RegisterInput): Promise<AuthResponseDto> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, role: Role.USER },
      select: { id: true, email: true, role: true },
    });
    return buildAuthResponse(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw Errors.emailExists();
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthResponseDto> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, role: true, passwordHash: true },
  });

  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordMatches) {
    // אותה תשובה בדיוק לאימייל שאינו קיים ולסיסמה שגויה
    throw Errors.invalidCredentials();
  }
  return buildAuthResponse(user);
}

export async function getCurrentUser(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  // משתמש שנמחק מהמסד אחרי שהטוקן הונפק מטופל כטוקן לא תקף
  if (!user) {
    throw Errors.unauthorized();
  }
  return toUserDto(user);
}
