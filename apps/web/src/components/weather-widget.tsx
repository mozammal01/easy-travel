'use client';

import { useEffect, useState } from 'react';
import type { WeatherSnapshotDto } from '@meghjatra/shared';
import { apiClient, ApiError } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WeatherWidget({ destination }: { destination: string }) {
  const [weather, setWeather] = useState<WeatherSnapshotDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ weather: WeatherSnapshotDto }>(`/weather?destination=${encodeURIComponent(destination)}`)
      .then(({ weather: fetched }) => setWeather(fetched))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load weather.');
      });
  }, [destination]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weather</CardTitle>
        <CardDescription>Current conditions in {destination}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {!error && !weather && <p className="text-sm text-muted-foreground">Loading weather...</p>}
        {weather && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="size-14"
            />
            <div>
              <p className="text-2xl font-semibold">{Math.round(weather.temperature)}°C</p>
              <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
              <p className="text-xs text-muted-foreground">
                Feels like {Math.round(weather.feelsLike)}°C · {weather.humidity}% humidity ·{' '}
                {weather.windSpeed} m/s wind
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
