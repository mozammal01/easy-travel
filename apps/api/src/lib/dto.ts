import type { DayPlan, Favourite, ItineraryItem, Review, Trip, User } from '@prisma/client';
import type {
  BudgetBreakdown,
  FavouriteDto,
  ItineraryItemDto,
  ReviewDto,
  TripDto,
  UserDto,
} from '@meghjatra/shared';

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

type TripWithItinerary = Trip & {
  itinerary: (DayPlan & { items: ItineraryItem[] })[];
};

export function toTripDto(trip: TripWithItinerary): TripDto {
  return {
    id: trip.id,
    userId: trip.userId,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budgetTotal: Number(trip.budgetTotal),
    budgetCurrency: trip.budgetCurrency,
    budgetBreakdown: trip.budgetBreakdown as BudgetBreakdown,
    itinerary: trip.itinerary.map((day) => ({
      id: day.id,
      dayIndex: day.dayIndex,
      items: day.items.map((item) => ({
        id: item.id,
        timeBlock: item.timeBlock as ItineraryItemDto['timeBlock'],
        order: item.order,
        activityName: item.activityName,
        durationMin: item.durationMin,
        cost: Number(item.cost),
        category: item.category as ItineraryItemDto['category'],
        mapLink: item.mapLink,
        tips: item.tips,
      })),
    })),
    accommodation: trip.accommodation as Record<string, unknown> | null,
    status: trip.status,
    shareToken: trip.shareToken,
    createdAt: trip.createdAt,
  };
}

export function toFavouriteDto(favourite: Favourite): FavouriteDto {
  return {
    id: favourite.id,
    itemType: favourite.itemType as FavouriteDto['itemType'],
    itemRef: favourite.itemRef,
    metadata: favourite.metadata as Record<string, unknown> | null,
    createdAt: favourite.createdAt,
  };
}

export function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    userId: review.userId,
    destination: review.destination,
    rating: review.rating,
    text: review.text,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    editableUntil: review.editableUntil,
    flagged: review.flagged,
  };
}
