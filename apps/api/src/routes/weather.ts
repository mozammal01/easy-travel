import { Router } from 'express';
import { weatherRequestSchema, type WeatherRequest } from '@meghjatra/shared';
import { validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { getCurrentWeather } from '../services/weather.service';

export const weatherRouter = Router();

weatherRouter.get(
  '/',
  validateQuery(weatherRequestSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as WeatherRequest;
    const weather = await getCurrentWeather(query.destination);
    res.json({ weather });
  }),
);
