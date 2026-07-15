import { z } from 'zod';
import type { DiscoveryRequest } from '@meghjatra/shared';
import { extractJson } from './extractJson';

const generatedDiscoveryItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['food', 'attraction']),
  description: z.string().min(1),
  rating: z.number().min(0).max(5),
  priceLevel: z.enum(['$', '$$', '$$$', '$$$$']),
  tags: z.array(z.string()),
});
export type GeneratedDiscoveryItem = z.infer<typeof generatedDiscoveryItemSchema>;

const generatedDiscoveryResponseSchema = z.object({
  items: z.array(generatedDiscoveryItemSchema).min(6),
});

export function buildDiscoveryPrompt(input: DiscoveryRequest): string {
  const lines = [
    'You are a local food-and-attraction discovery engine for the MeghJatra travel planning app.',
    `Suggest at least 6 real-style restaurants/eateries and tourist attractions in ${input.destination}.`,
    input.category
      ? `Only include items in the "${input.category}" category.`
      : 'Include a mix of both "food" and "attraction" categories.',
    input.interests.length > 0 ? `Traveler interests: ${input.interests.join(', ')}.` : '',
    input.budgetLevel ? `Budget level: ${input.budgetLevel}.` : '',
    'Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape:',
    '{ "items": [ { "name": string, "category": "food" | "attraction", "description": string (1-2 sentences), "rating": number (0 to 5), "priceLevel": "$" | "$$" | "$$$" | "$$$$", "tags": string[] } ] }',
    'Include at least 6 items with varied categories and price points.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function parseDiscoveryResponse(raw: string): GeneratedDiscoveryItem[] {
  const jsonText = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  const result = generatedDiscoveryResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI response did not match expected schema: ${result.error.message}`);
  }

  return result.data.items;
}
