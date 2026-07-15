import type { CreateReviewInput, ListReviewsQuery, UpdateReviewInput } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

const EDIT_WINDOW_DAYS = 30;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const existing = await prisma.review.findUnique({
    where: { userId_destination: { userId, destination: input.destination } },
  });
  if (existing) {
    throw new HttpError(409, 'You have already reviewed this destination');
  }

  const now = new Date();
  return prisma.review.create({
    data: {
      userId,
      destination: input.destination,
      rating: input.rating,
      text: input.text,
      createdAt: now,
      editableUntil: addDays(now, EDIT_WINDOW_DAYS),
    },
  });
}

export async function listReviews(query: ListReviewsQuery) {
  const orderBy =
    query.sort === 'rating'
      ? { rating: 'desc' as const }
      : query.sort === 'helpful'
        ? { helpfulCount: 'desc' as const }
        : { createdAt: 'desc' as const };

  return prisma.review.findMany({
    where: { destination: query.destination },
    orderBy,
  });
}

async function getOwnedReview(userId: string, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new HttpError(404, 'Review not found');
  }
  if (review.userId !== userId) {
    throw new HttpError(403, 'You can only modify your own review');
  }
  return review;
}

export async function updateReview(userId: string, reviewId: string, input: UpdateReviewInput) {
  const review = await getOwnedReview(userId, reviewId);
  if (review.editableUntil.getTime() < Date.now()) {
    throw new HttpError(403, 'The 30-day edit window for this review has passed');
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: input.rating,
      text: input.text,
    },
  });
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
  await getOwnedReview(userId, reviewId);
  await prisma.review.delete({ where: { id: reviewId } });
}

export async function flagReview(userId: string, reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new HttpError(404, 'Review not found');
  }
  if (review.userId === userId) {
    throw new HttpError(400, 'You cannot flag your own review');
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: { flagged: true },
  });
}
