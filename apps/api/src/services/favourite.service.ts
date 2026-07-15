import type { CreateFavouriteInput, ListFavouritesQuery } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { paginate } from '../lib/paginate';

const DEFAULT_LIMIT = 24;

export async function listFavourites(userId: string, query: ListFavouritesQuery) {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const rows = await prisma.favourite.findMany({
    where: { userId, itemType: query.itemType },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  return paginate(rows, limit);
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
