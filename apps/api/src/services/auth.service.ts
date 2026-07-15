import type { User } from '@prisma/client';
import type { LoginInput, RegisterInput, UserDto } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken } from '../lib/jwt';
import { HttpError } from '../middleware/errorHandler';

function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    interests: user.interests,
    currency: user.currency,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function issueSession(user: User) {
  return {
    user: toUserDto(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      interests: [],
    },
  });

  return issueSession(user);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash || user.deletedAt) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return issueSession(user);
}

export async function refreshSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new HttpError(401, 'Invalid session');
  }

  return issueSession(user);
}
