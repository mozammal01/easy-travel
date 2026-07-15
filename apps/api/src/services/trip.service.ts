import type { CreateTripInput } from '@meghjatra/shared';
import { prisma } from '../lib/prisma';
import { getAiProvider } from '../ai';
import { HttpError } from '../middleware/errorHandler';

const MAX_ACTIVE_TRIPS_PER_USER = 50;
const MIN_TRIP_DAYS = 1;
const MAX_TRIP_DAYS = 60;

function computeTotalDays(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
}

export async function generateTripItinerary(userId: string, input: CreateTripInput) {
  const activeCount = await prisma.trip.count({
    where: { userId, deletedAt: null, status: { not: 'ARCHIVED' } },
  });
  if (activeCount >= MAX_ACTIVE_TRIPS_PER_USER) {
    throw new HttpError(
      409,
      `You've reached the limit of ${MAX_ACTIVE_TRIPS_PER_USER} active trips`,
    );
  }

  const totalDays = computeTotalDays(input.startDate, input.endDate);
  if (totalDays < MIN_TRIP_DAYS || totalDays > MAX_TRIP_DAYS) {
    throw new HttpError(
      400,
      `Trip length must be between ${MIN_TRIP_DAYS} and ${MAX_TRIP_DAYS} days`,
    );
  }

  const provider = getAiProvider();
  const generatedDays = await provider.generateItinerary(input, totalDays);

  return prisma.trip.create({
    data: {
      userId,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      travelers: input.travelers,
      budgetTotal: input.budgetTotal,
      budgetCurrency: input.budgetCurrency,
      budgetBreakdown: { flights: 0, stay: 0, food: 0, activities: 0, misc: 0 },
      status: 'DRAFT',
      itinerary: {
        create: generatedDays.map((day) => ({
          dayIndex: day.dayIndex,
          items: {
            create: day.items.map((item) => ({
              timeBlock: item.timeBlock,
              order: item.order,
              activityName: item.activityName,
              durationMin: item.durationMin,
              cost: item.cost,
              mapLink: item.mapLink ?? undefined,
              tips: item.tips ?? undefined,
            })),
          },
        })),
      },
    },
    include: {
      itinerary: {
        orderBy: { dayIndex: 'asc' },
        include: {
          items: { orderBy: { order: 'asc' } },
        },
      },
    },
  });
}
