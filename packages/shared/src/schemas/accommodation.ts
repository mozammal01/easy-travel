import { z } from 'zod';

export const accommodationRequestSchema = z.object({
  destination: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travelers: z.coerce.number().int().positive(),
  budgetLevel: z.enum(['budget', 'mid-range', 'luxury']).optional(),
  currency: z.string().length(3).default('USD'),
});
export type AccommodationRequest = z.infer<typeof accommodationRequestSchema>;

export const accommodationSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(0).max(5),
  pricePerNight: z.number().nonnegative(),
  currency: z.string().length(3),
  amenities: z.array(z.string()),
  galleryImageUrls: z.array(z.string()),
  partnerDeepLink: z.string().url(),
});
export type AccommodationDto = z.infer<typeof accommodationSchema>;

export const accommodationResponseSchema = z.object({
  accommodations: z.array(accommodationSchema).min(3),
});
export type AccommodationResponse = z.infer<typeof accommodationResponseSchema>;
