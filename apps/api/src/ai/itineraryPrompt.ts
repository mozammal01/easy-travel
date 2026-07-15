import { generatedItinerarySchema, type CreateTripInput, type GeneratedDayPlan } from '@meghjatra/shared';
import { extractJson } from './extractJson';

export function buildItineraryPrompt(input: CreateTripInput, totalDays: number): string {
  const itemsPerDayHint =
    input.style === 'packed' ? '4-5' : input.style === 'relaxed' ? '2-3' : '3-4';

  const lines = [
    'You are an itinerary-planning engine for the MeghJatra travel planning app.',
    `Build a ${totalDays}-day itinerary for a trip to ${input.destination}.`,
    `Travelers: ${input.travelers}. Total budget: ${input.budgetTotal} ${input.budgetCurrency}.`,
    `Trip style: ${input.style} (aim for ${itemsPerDayHint} activities per day, spread across morning/afternoon/evening).`,
    'Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape:',
    '{ "days": [ { "dayIndex": number (0-based), "items": [ { "timeBlock": "morning" | "afternoon" | "evening", "order": number, "activityName": string, "durationMin": number, "cost": number, "category": "flights" | "stay" | "food" | "activities" | "misc", "mapLink": string | null, "tips": string | null } ] } ] }',
    'Tag each item with the budget category it belongs to: "food" for meals/restaurants, "activities" for sightseeing/tours/entertainment, "flights" for any air travel/transfers, "stay" for lodging-related costs, "misc" for anything else.',
    `Include exactly ${totalDays} day objects, with dayIndex from 0 to ${totalDays - 1}, each containing at least one item. Keep total item cost roughly within the trip budget.`,
  ];
  return lines.join('\n');
}

export function parseItineraryResponse(raw: string, expectedDays: number): GeneratedDayPlan[] {
  const jsonText = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  const result = generatedItinerarySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI response did not match expected schema: ${result.error.message}`);
  }

  if (result.data.days.length !== expectedDays) {
    throw new Error(
      `AI response returned ${result.data.days.length} days, expected ${expectedDays}`,
    );
  }

  return [...result.data.days].sort((a, b) => a.dayIndex - b.dayIndex);
}
