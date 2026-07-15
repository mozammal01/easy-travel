import type { WeatherSnapshotDto } from '@meghjatra/shared';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const REQUEST_TIMEOUT_MS = 10_000;

interface OwmCurrentWeatherResponse {
  weather?: Array<{ main: string; description: string; icon: string }>;
  main?: { temp: number; feels_like: number; humidity: number };
  wind?: { speed: number };
  name?: string;
}

export async function getCurrentWeather(destination: string): Promise<WeatherSnapshotDto> {
  if (!env.OPENWEATHERMAP_API_KEY) {
    throw new HttpError(503, 'Weather provider is not configured (missing OPENWEATHERMAP_API_KEY)');
  }

  const url = `${OWM_BASE}/weather?q=${encodeURIComponent(destination)}&appid=${env.OPENWEATHERMAP_API_KEY}&units=metric`;
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

  if (res.status === 404) {
    throw new HttpError(404, `No weather data found for "${destination}"`);
  }
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new HttpError(502, `Weather API request failed (${res.status}): ${errorBody}`);
  }

  const data = (await res.json()) as OwmCurrentWeatherResponse;
  const weather = data.weather?.[0];
  if (!data.main || !weather) {
    throw new HttpError(502, 'Weather API returned an unexpected response shape');
  }

  return {
    destination: data.name ?? destination,
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    windSpeed: data.wind?.speed ?? 0,
    condition: weather.main,
    description: weather.description,
    icon: weather.icon,
  };
}
