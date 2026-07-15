import type { ChatContext, ChatMessage } from '@meghjatra/shared';

export function buildChatPrompt(messages: ChatMessage[], context?: ChatContext): string {
  const lines = [
    'You are Megh, a friendly and knowledgeable AI travel assistant for the MeghJatra travel planning app.',
    'Help the traveler with destination advice, itinerary tweaks, packing tips, and general travel questions.',
    'Keep replies concise (2-4 sentences), conversational, and in plain text - never respond with JSON or markdown.',
    context?.destination ? `The traveler is currently planning a trip to ${context.destination}.` : '',
    'Conversation so far:',
    ...messages.map((m) => `${m.role === 'user' ? 'Traveler' : 'Megh'}: ${m.content}`),
    'Megh:',
  ];
  return lines.filter(Boolean).join('\n');
}
