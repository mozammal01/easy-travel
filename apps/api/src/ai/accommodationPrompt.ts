import { z } from 'zod';
import type { AccommodationRequest } from '@meghjatra/shared';
import { extractJson } from './extractJson';

const generatedAccommodationSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(0).max(5),
  pricePerNight: z.number().nonnegative(),
  amenities: z.array(z.string()),
});
export type GeneratedAccommodation = z.infer<typeof generatedAccommodationSchema>;

const generatedAccommodationResponseSchema = z.object({
  accommodations: z.array(generatedAccommodationSchema).min(3),
});

export function buildAccommodationPrompt(input: AccommodationRequest): string {
  const lines = [
    'You are an accommodation-recommendation engine for the MeghJatra travel planning app.',
    `Suggest at least 3 real-style hotel/lodging options for a stay in ${input.destination}.`,
    `Check-in: ${input.startDate.toISOString().slice(0, 10)}, check-out: ${input.endDate.toISOString().slice(0, 10)}, travelers: ${input.travelers}.`,
    input.budgetLevel ? `Budget level: ${input.budgetLevel}.` : '',
    'Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape:',
    '{ "accommodations": [ { "name": string, "rating": number (0 to 5), "pricePerNight": number, "amenities": string[] } ] }',
    'Include at least 3 options with varied price points.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function parseAccommodationResponse(raw: string): GeneratedAccommodation[] {
  const jsonText = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  const result = generatedAccommodationResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI response did not match expected schema: ${result.error.message}`);
  }

  return result.data.accommodations;
}
