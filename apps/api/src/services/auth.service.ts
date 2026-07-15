import type { User } from '@prisma/client';
import type { LoginInput, RegisterInput } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken } from '../lib/jwt';
import { generateResetToken, hashResetToken } from '../lib/resetToken';
import { toUserDto } from '../lib/dto';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

function sendPasswordResetEmail(email: string, rawToken: string) {
  const resetLink = `${env.CORS_ORIGIN}/reset-password?token=${rawToken}`;
  console.log(`[email:stub] Password reset link for ${email}: ${resetLink}`);
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

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always behave the same way regardless of whether the account exists, to avoid user enumeration.
  if (!user || user.deletedAt) {
    return;
  }

  const { rawToken, tokenHash } = generateResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  sendPasswordResetEmail(user.email, rawToken);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashResetToken(rawToken);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new HttpError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}
