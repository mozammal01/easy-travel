import { z } from 'zod';
import { roleSchema } from './enums';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  interests: z.array(z.string()),
  currency: z.string().length(3),
  language: z.string().min(2).max(10),
  role: roleSchema,
  createdAt: z.coerce.date(),
});
export type UserDto = z.infer<typeof userSchema>;

export const updateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  interests: z.array(z.string()).optional(),
  currency: z.string().length(3).optional(),
  language: z.string().min(2).max(10).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
