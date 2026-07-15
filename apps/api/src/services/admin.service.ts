import type {
  ListFlaggedReviewsQuery,
  ListUsersQuery,
  UpdateUserRoleInput,
} from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { paginate } from '../lib/paginate';
import { HttpError } from '../middleware/errorHandler';

const DEFAULT_LIMIT = 24;

export async function listUsers(query: ListUsersQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const rows = await prisma.user.findMany({
    where: {
      role: query.role,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { displayName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  return paginate(rows, limit);
}

async function getUserOrThrow(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}

export async function updateUserRole(
  actingUserId: string,
  targetUserId: string,
  input: UpdateUserRoleInput,
) {
  if (actingUserId === targetUserId) {
    throw new HttpError(400, 'You cannot change your own role');
  }
  await getUserOrThrow(targetUserId);
  return prisma.user.update({ where: { id: targetUserId }, data: { role: input.role } });
}

export async function setUserActiveStatus(
  actingUserId: string,
  targetUserId: string,
  active: boolean,
) {
  if (actingUserId === targetUserId) {
    throw new HttpError(400, 'You cannot change the status of your own account');
  }
  await getUserOrThrow(targetUserId);
  return prisma.user.update({
    where: { id: targetUserId },
    data: { deletedAt: active ? null : new Date() },
  });
}

export async function listFlaggedReviews(query: ListFlaggedReviewsQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const rows = await prisma.review.findMany({
    where: { flagged: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  return paginate(rows, limit);
}

export async function resolveFlaggedReview(reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new HttpError(404, 'Review not found');
  }
  return prisma.review.update({ where: { id: reviewId }, data: { flagged: false } });
}

export async function removeReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new HttpError(404, 'Review not found');
  }
  await prisma.review.delete({ where: { id: reviewId } });
}
