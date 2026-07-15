import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

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
