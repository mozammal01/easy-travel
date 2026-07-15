import type { CreateDestinationInput, UpdateDestinationInput } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

export async function listDestinations() {
  return prisma.destination.findMany({ orderBy: { name: 'asc' } });
}

export async function getDestinationById(id: string) {
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) {
    throw new HttpError(404, 'Destination not found');
  }
  return destination;
}

export async function createDestination(input: CreateDestinationInput) {
  const existing = await prisma.destination.findUnique({
    where: { name_country: { name: input.name, country: input.country } },
  });
  if (existing) {
    throw new HttpError(409, 'A destination with this name and country already exists');
  }

  return prisma.destination.create({
    data: {
      ...input,
      galleryImageUrls: input.galleryImageUrls ?? [],
      tags: input.tags ?? [],
    },
  });
}

export async function updateDestination(id: string, input: UpdateDestinationInput) {
  await getDestinationById(id);
  return prisma.destination.update({ where: { id }, data: input });
}

export async function deleteDestination(id: string): Promise<void> {
  await getDestinationById(id);
  await prisma.destination.delete({ where: { id } });
}
