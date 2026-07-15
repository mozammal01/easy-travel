'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AccommodationDto, TripDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

function toDateParam(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function AccommodationComparison({ tripId }: { tripId: string }) {
  const { accessToken } = useAuth();
  const [trip, setTrip] = useState<TripDto | null>(null);
  const [accommodations, setAccommodations] = useState<AccommodationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinning, setPinning] = useState<string | null>(null);
  const [pinnedName, setPinnedName] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    apiClient
      .get<{ trip: TripDto }>(`/trips/${tripId}`, { headers })
      .then((tripRes) => {
        const fetchedTrip = tripRes.trip;
        setTrip(fetchedTrip);
        setPinnedName((fetchedTrip.accommodation as { name?: string } | null)?.name ?? null);

        const params = new URLSearchParams({
          destination: fetchedTrip.destination,
          startDate: toDateParam(fetchedTrip.startDate),
          endDate: toDateParam(fetchedTrip.endDate),
          travelers: String(fetchedTrip.travelers),
          currency: fetchedTrip.budgetCurrency,
        });

        return apiClient.get<{ accommodations: AccommodationDto[] }>(
          `/accommodations?${params.toString()}`,
          { headers },
        );
      })
      .then((res) => setAccommodations(res.accommodations))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load accommodations.');
      });
  }, [accessToken, tripId]);

  async function handlePin(accommodation: AccommodationDto) {
    setPinning(accommodation.name);
    setError(null);
    try {
      await apiClient.post(`/trips/${tripId}/accommodation`, accommodation, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setPinnedName(accommodation.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to pin accommodation.');
    } finally {
      setPinning(null);
    }
  }

  if (error && !accommodations) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load accommodations</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!trip || !accommodations) {
    return <p className="text-muted-foreground">Loading accommodations...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href={`/trips/${tripId}`} />}
      >
        ← Back to itinerary
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compare stays in {trip.destination}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(trip.startDate).toLocaleDateString()} –{' '}
          {new Date(trip.endDate).toLocaleDateString()} · {trip.travelers} traveler
          {trip.travelers > 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[720px] gap-4"
          style={{
            gridTemplateColumns: `repeat(${accommodations.length}, minmax(220px, 1fr))`,
          }}
        >
          {accommodations.map((hotel) => {
            const isPinned = pinnedName === hotel.name;
            return (
              <Card key={hotel.name} className={isPinned ? 'border-primary' : undefined}>
                <CardHeader>
                  <CardTitle className="text-base">{hotel.name}</CardTitle>
                  <CardDescription>
                    {hotel.rating.toFixed(1)} ★ · {hotel.pricePerNight} {hotel.currency}/night
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {hotel.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={isPinned ? 'secondary' : 'default'}
                    disabled={pinning === hotel.name}
                    onClick={() => handlePin(hotel)}
                  >
                    {isPinned ? 'Pinned' : pinning === hotel.name ? 'Pinning...' : 'Pin to itinerary'}
                  </Button>
                  <Button size="sm" variant="ghost" disabled title="Partner booking coming soon">
                    View deal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
