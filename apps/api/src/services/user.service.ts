import type { UpdateProfileInput, UserDto } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { toUserDto } from '../lib/dto';
import { HttpError } from '../middleware/errorHandler';

export async function getCurrentUser(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new HttpError(404, 'User not found');
  }

  return toUserDto(user);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new HttpError(404, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  return toUserDto(updated);
}

export async function setAvatar(userId: string, avatarUrl: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new HttpError(404, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  return toUserDto(updated);
}

export async function softDeleteCurrentUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    throw new HttpError(404, 'User not found');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}
