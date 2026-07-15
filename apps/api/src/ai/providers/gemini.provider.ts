import type { CreateTripInput, DestinationRecommendation, GeneratedDayPlan, RecommendationRequest } from '@meghjatra/shared';
import type { AiProvider } from '../types';
import { buildRecommendationPrompt, parseRecommendationResponse } from '../prompt';
import { buildItineraryPrompt, parseItineraryResponse } from '../itineraryPrompt';
import { AI_REQUEST_TIMEOUT_MS } from '../constants';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/errorHandler';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiGenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export class GeminiProvider implements AiProvider {
  async getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]> {
    const prompt = buildRecommendationPrompt(input);
    const text = await this.callGemini(prompt);
    return parseRecommendationResponse(text);
  }

  async generateItinerary(
    input: CreateTripInput,
    totalDays: number,
  ): Promise<GeneratedDayPlan[]> {
    const prompt = buildItineraryPrompt(input, totalDays);
    const text = await this.callGemini(prompt);
    return parseItineraryResponse(text, totalDays);
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new HttpError(503, 'AI provider is not configured (missing GEMINI_API_KEY)');
    }

    const res = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new HttpError(502, `Gemini API request failed (${res.status}): ${errorBody}`);
    }

    const data = (await res.json()) as GeminiGenerateContentResponse;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new HttpError(502, 'Gemini API returned an unexpected response shape');
    }

    return text;
  }
}
