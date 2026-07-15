import type { ChatRequest } from '@meghjatra/shared';
import { getAiProvider } from '../ai';

export async function getChatReply(input: ChatRequest): Promise<string> {
  const provider = getAiProvider();
  return provider.chat(input.messages, input.context);
}
