import { z } from 'zod';

export const weatherRequestSchema = z.object({
  destination: z.string().min(1),
});
export type WeatherRequest = z.infer<typeof weatherRequestSchema>;

export const weatherSnapshotSchema = z.object({
  destination: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  condition: z.string(),
  description: z.string(),
  icon: z.string(),
});
export type WeatherSnapshotDto = z.infer<typeof weatherSnapshotSchema>;
