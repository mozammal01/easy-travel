import { z } from 'zod';
import { tripStatusSchema } from './enums';

export const budgetBreakdownSchema = z.object({
  flights: z.number().nonnegative(),
  stay: z.number().nonnegative(),
  food: z.number().nonnegative(),
  activities: z.number().nonnegative(),
  misc: z.number().nonnegative(),
});
export type BudgetBreakdown = z.infer<typeof budgetBreakdownSchema>;

export const itineraryItemSchema = z.object({
  id: z.string().uuid(),
  timeBlock: z.enum(['morning', 'afternoon', 'evening']),
  order: z.number().int().nonnegative(),
  activityName: z.string().min(1),
  durationMin: z.number().int().positive(),
  cost: z.number().nonnegative(),
  mapLink: z.string().url().nullable().optional(),
  tips: z.string().nullable().optional(),
});
export type ItineraryItemDto = z.infer<typeof itineraryItemSchema>;

export const dayPlanSchema = z.object({
  id: z.string().uuid(),
  dayIndex: z.number().int().nonnegative(),
  items: z.array(itineraryItemSchema),
});
export type DayPlanDto = z.infer<typeof dayPlanSchema>;

export const tripSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  destination: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travelers: z.number().int().positive(),
  budgetTotal: z.number().nonnegative(),
  budgetCurrency: z.string().length(3),
  budgetBreakdown: budgetBreakdownSchema,
  itinerary: z.array(dayPlanSchema),
  accommodation: z.record(z.string(), z.unknown()).nullable().optional(),
  status: tripStatusSchema,
  shareToken: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});
export type TripDto = z.infer<typeof tripSchema>;

export const createTripInputSchema = z
  .object({
    destination: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    travelers: z.number().int().positive(),
    budgetTotal: z.number().nonnegative(),
    budgetCurrency: z.string().length(3),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });
export type CreateTripInput = z.infer<typeof createTripInputSchema>;
