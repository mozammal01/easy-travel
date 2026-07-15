import type {
  CreateItineraryItemInput,
  CreateTripInput,
  UpdateItineraryItemInput,
} from '@meghjatra/shared';
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

export async function getTripForUser(userId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      itinerary: {
        orderBy: { dayIndex: 'asc' },
        include: {
          items: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!trip || trip.userId !== userId || trip.deletedAt) {
    throw new HttpError(404, 'Trip not found');
  }

  return trip;
}

export async function updateItineraryItem(
  userId: string,
  tripId: string,
  itemId: string,
  input: UpdateItineraryItemInput,
) {
  const trip = await getTripForUser(userId, tripId);
  const item = trip.itinerary.flatMap((day) => day.items).find((i) => i.id === itemId);
  if (!item) {
    throw new HttpError(404, 'Itinerary item not found');
  }

  if (input.dayPlanId && !trip.itinerary.some((day) => day.id === input.dayPlanId)) {
    throw new HttpError(400, 'Invalid dayPlanId for this trip');
  }

  await prisma.itineraryItem.update({
    where: { id: itemId },
    data: {
      dayPlanId: input.dayPlanId,
      timeBlock: input.timeBlock,
      order: input.order,
    },
  });

  return getTripForUser(userId, tripId);
}

export async function addItineraryItem(
  userId: string,
  tripId: string,
  input: CreateItineraryItemInput,
) {
  const trip = await getTripForUser(userId, tripId);
  const targetDay = trip.itinerary.find((day) => day.id === input.dayPlanId);
  if (!targetDay) {
    throw new HttpError(400, 'Invalid dayPlanId for this trip');
  }

  const siblingOrders = targetDay.items
    .filter((item) => item.timeBlock === input.timeBlock)
    .map((item) => item.order);
  const nextOrder = siblingOrders.length > 0 ? Math.max(...siblingOrders) + 1 : 0;

  await prisma.itineraryItem.create({
    data: {
      dayPlanId: input.dayPlanId,
      timeBlock: input.timeBlock,
      order: nextOrder,
      activityName: input.activityName,
      durationMin: input.durationMin,
      cost: input.cost,
      mapLink: input.mapLink ?? undefined,
      tips: input.tips ?? undefined,
    },
  });

  return getTripForUser(userId, tripId);
}

export async function removeItineraryItem(userId: string, tripId: string, itemId: string) {
  const trip = await getTripForUser(userId, tripId);
  const item = trip.itinerary.flatMap((day) => day.items).find((i) => i.id === itemId);
  if (!item) {
    throw new HttpError(404, 'Itinerary item not found');
  }

  await prisma.itineraryItem.delete({ where: { id: itemId } });

  return getTripForUser(userId, tripId);
}
