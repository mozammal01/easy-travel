import { z } from 'zod';

export const roleSchema = z.enum(['USER', 'MODERATOR', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const tripStatusSchema = z.enum(['DRAFT', 'UPCOMING', 'COMPLETED', 'ARCHIVED']);
export type TripStatus = z.infer<typeof tripStatusSchema>;
