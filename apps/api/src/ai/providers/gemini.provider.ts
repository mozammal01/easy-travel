import type { DestinationRecommendation, RecommendationRequest } from '@meghjatra/shared';
import type { AiProvider } from '../types';
import { buildRecommendationPrompt, parseRecommendationResponse } from '../prompt';
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
    if (!env.GEMINI_API_KEY) {
      throw new HttpError(503, 'AI provider is not configured (missing GEMINI_API_KEY)');
    }

    const prompt = buildRecommendationPrompt(input);
    const res = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
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

    return parseRecommendationResponse(text);
  }
}
