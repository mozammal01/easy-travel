'use client';

import { useEffect, useState } from 'react';
import type { DayPlanDto, TripDto } from '@meghjatra/shared';
import { apiClient, ApiError } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WeatherWidget } from '@/components/weather-widget';
import { MapEmbed } from '@/components/map-embed';

const TIME_BLOCKS = ['morning', 'afternoon', 'evening'] as const;

export function SharedItineraryView({ token }: { token: string }) {
  const [trip, setTrip] = useState<TripDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ trip: TripDto }>(`/trips/shared/${token}`)
      .then(({ trip: fetched }) => setTrip(fetched))
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'This share link is invalid or no longer available.',
        );
      });
  }, [token]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load this itinerary</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!trip) {
    return <p className="text-muted-foreground">Loading itinerary...</p>;
  }

  const sortedDays = [...trip.itinerary].sort((a, b) => a.dayIndex - b.dayIndex);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Shared itinerary</p>
        <h1 className="text-3xl font-semibold tracking-tight">{trip.destination}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(trip.startDate).toLocaleDateString()} –{' '}
          {new Date(trip.endDate).toLocaleDateString()} · {trip.travelers} traveler
          {trip.travelers > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WeatherWidget destination={trip.destination} />
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Map</CardTitle>
          </CardHeader>
          <CardContent className="h-56 p-0">
            <MapEmbed query={trip.destination} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedDays.map((day) => (
          <DayCard key={day.id} day={day} currency={trip.budgetCurrency} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, currency }: { day: DayPlanDto; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Day {day.dayIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {TIME_BLOCKS.map((timeBlock) => {
          const items = day.items
            .filter((item) => item.timeBlock === timeBlock)
            .sort((a, b) => a.order - b.order);
          if (items.length === 0) return null;

          return (
            <div key={timeBlock} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">{timeBlock}</p>
              {items.map((item) => (
                <div key={item.id} className="rounded-md border bg-card p-2 text-sm">
                  <p className="font-medium">{item.activityName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.durationMin} min · {item.cost} {currency}
                  </p>
                  {item.tips && (
                    <p className="mt-1 text-xs text-muted-foreground">Tip: {item.tips}</p>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
