import type { AiProvider } from './types';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { env } from '../config/env';

let cachedProvider: AiProvider | undefined;

export function getAiProvider(): AiProvider {
  if (!cachedProvider) {
    cachedProvider = env.AI_PROVIDER === 'openai' ? new OpenAiProvider() : new GeminiProvider();
  }
  return cachedProvider;
}

export type { AiProvider } from './types';
