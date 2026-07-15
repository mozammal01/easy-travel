import type { CreateTripInput, DestinationRecommendation, GeneratedDayPlan, RecommendationRequest } from '@meghjatra/shared';
import type { AiProvider } from '../types';
import { buildRecommendationPrompt, parseRecommendationResponse } from '../prompt';
import { buildItineraryPrompt, parseItineraryResponse } from '../itineraryPrompt';
import { AI_REQUEST_TIMEOUT_MS } from '../constants';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/errorHandler';

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface OpenAiChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAiProvider implements AiProvider {
  async getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]> {
    const prompt = buildRecommendationPrompt(input);
    const text = await this.callOpenAi(prompt);
    return parseRecommendationResponse(text);
  }

  async generateItinerary(
    input: CreateTripInput,
    totalDays: number,
  ): Promise<GeneratedDayPlan[]> {
    const prompt = buildItineraryPrompt(input, totalDays);
    const text = await this.callOpenAi(prompt);
    return parseItineraryResponse(text, totalDays);
  }

  private async callOpenAi(prompt: string): Promise<string> {
    if (!env.OPENAI_API_KEY) {
      throw new HttpError(503, 'AI provider is not configured (missing OPENAI_API_KEY)');
    }

    const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new HttpError(502, `OpenAI API request failed (${res.status}): ${errorBody}`);
    }

    const data = (await res.json()) as OpenAiChatCompletionResponse;
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new HttpError(502, 'OpenAI API returned an unexpected response shape');
    }

    return text;
  }
}
