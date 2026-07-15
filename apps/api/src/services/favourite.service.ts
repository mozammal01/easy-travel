import type { CreateFavouriteInput } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';

export async function listFavourites(userId: string) {
  return prisma.favourite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addFavourite(userId: string, input: CreateFavouriteInput) {
  return prisma.favourite.upsert({
    where: {
      userId_itemType_itemRef: { userId, itemType: input.itemType, itemRef: input.itemRef },
    },
    create: {
      userId,
      itemType: input.itemType,
      itemRef: input.itemRef,
      metadata: input.metadata as object | undefined,
    },
    update: {
      metadata: input.metadata as object | undefined,
    },
  });
}

export async function removeFavourite(
  userId: string,
  itemType: string,
  itemRef: string,
): Promise<void> {
  await prisma.favourite.deleteMany({
    where: { userId, itemType, itemRef },
  });
}
