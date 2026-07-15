import { recommendationResponseSchema, type DestinationRecommendation, type RecommendationRequest } from '@meghjatra/shared';

export function buildRecommendationPrompt(input: RecommendationRequest): string {
  const lines = [
    'You are a travel-recommendation engine for the MeghJatra travel planning app.',
    'Suggest at least 5 real-world travel destinations ranked by how well they fit the traveler.',
    input.interests.length > 0 ? `Traveler interests: ${input.interests.join(', ')}.` : '',
    input.region ? `Preferred region: ${input.region}.` : '',
    input.budgetLevel ? `Budget level: ${input.budgetLevel}.` : '',
    input.durationDays ? `Trip duration: ${input.durationDays} days.` : '',
    'Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape:',
    '{ "recommendations": [ { "destination": string, "country": string, "summary": string (1-2 sentences), "confidence": number (0 to 1), "budgetLevel": "budget" | "mid-range" | "luxury", "bestSeason": string, "tags": string[] } ] }',
    'Include at least 5 items, ranked from highest to lowest confidence.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function parseRecommendationResponse(raw: string): DestinationRecommendation[] {
  const jsonText = extractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  const result = recommendationResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI response did not match expected schema: ${result.error.message}`);
  }

  return [...result.data.recommendations].sort((a, b) => b.confidence - a.confidence);
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}
