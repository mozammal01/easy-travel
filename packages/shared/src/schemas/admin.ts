import { z } from 'zod';
import { roleSchema } from './enums';
import { reviewSchema } from './review';

export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: roleSchema,
  createdAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type AdminUserDto = z.infer<typeof adminUserSchema>;

export const listUsersQuerySchema = z.object({
  search: z.string().min(1).optional(),
  role: roleSchema.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const adminUserListResponseSchema = z.object({
  users: z.array(adminUserSchema),
  nextCursor: z.string().uuid().nullable(),
});
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const updateUserRoleInputSchema = z.object({
  role: roleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;

export const listFlaggedReviewsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type ListFlaggedReviewsQuery = z.infer<typeof listFlaggedReviewsQuerySchema>;

export const flaggedReviewListResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  nextCursor: z.string().uuid().nullable(),
});
export type FlaggedReviewListResponse = z.infer<typeof flaggedReviewListResponseSchema>;
