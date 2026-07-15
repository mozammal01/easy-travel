import type { User } from '@prisma/client';
import type { UserDto } from '@meghjatra/shared';

export function toUserDto(user: User): UserDto {
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
