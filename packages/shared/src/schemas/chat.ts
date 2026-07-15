import { z } from 'zod';

export const chatRoleSchema = z.enum(['user', 'assistant']);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1).max(2000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatContextSchema = z.object({
  destination: z.string().min(1).optional(),
});
export type ChatContext = z.infer<typeof chatContextSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
  context: chatContextSchema.optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: chatMessageSchema,
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;
