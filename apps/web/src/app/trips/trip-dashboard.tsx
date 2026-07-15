'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { TripDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'newest' | 'oldest' | 'destination';

const STATUS_BADGE: Record<TripDto['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'text-muted-foreground' },
  UPCOMING: { label: 'Upcoming', className: 'text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Completed', className: 'text-green-600 dark:text-green-500' },
  ARCHIVED: { label: 'Archived', className: 'text-muted-foreground' },
};

export function TripDashboard() {
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState<TripDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('newest');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function load() {
    apiClient
      .get<{ trips: TripDto[] }>('/trips', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(({ trips: fetched }) => setTrips(fetched))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load trips.'));
  }

  useEffect(() => {
    if (!accessToken) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const sortedTrips = useMemo(() => {
    if (!trips) return [];
    const copy = [...trips];
    switch (sort) {
      case 'oldest':
        return copy.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case 'destination':
        return copy.sort((a, b) => a.destination.localeCompare(b.destination));
      case 'newest':
      default:
        return copy.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [trips, sort]);

  async function handleDuplicate(tripId: string) {
    setActionError(null);
    try {
      await apiClient.post(`/trips/${tripId}/duplicate`, undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to duplicate trip.');
    }
  }

  function shareUrlFor(trip: TripDto): string | null {
    if (!trip.shareToken) return null;
    return `${window.location.origin}/shared/${trip.shareToken}`;
  }

  async function handleShare(trip: TripDto) {
    setSharingId(trip.id);
    setActionError(null);
    try {
      const { trip: updated } = await apiClient.post<{ trip: TripDto }>(
        `/trips/${trip.id}/share`,
        undefined,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setTrips((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to create share link.');
    } finally {
      setSharingId(null);
    }
  }

  async function handleStopSharing(trip: TripDto) {
    setSharingId(trip.id);
    setActionError(null);
    try {
      const { trip: updated } = await apiClient.delete<{ trip: TripDto }>(`/trips/${trip.id}/share`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTrips((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to stop sharing.');
    } finally {
      setSharingId(null);
    }
  }

  async function handleCopyLink(trip: TripDto) {
    const url = shareUrlFor(trip);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId((id) => (id === trip.id ? null : id)), 2000);
  }

  async function handleDelete(tripId: string) {
    if (!window.confirm('Delete this trip? It will disappear from your dashboard.')) {
      return;
    }
    setActionError(null);
    try {
      await apiClient.delete(`/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTrips((prev) => prev?.filter((t) => t.id !== tripId) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete trip.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your trips</h1>
          <p className="text-sm text-muted-foreground">
            All your planned and past trips in one place.
          </p>
        </div>
        <Button render={<Link href="/trips/new" />}>Plan a new trip</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load trips</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {!trips && !error && <p className="text-muted-foreground">Loading trips...</p>}

      {trips && trips.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="destination">Destination (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {trips && trips.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">You haven&apos;t planned any trips yet.</p>
            <Button render={<Link href="/trips/new" />}>Plan your first trip</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTrips.map((trip) => {
          const badge = STATUS_BADGE[trip.status];
          return (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{trip.destination}</CardTitle>
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(trip.startDate).toLocaleDateString()} –{' '}
                  {new Date(trip.endDate).toLocaleDateString()} · {trip.itinerary.length} day
                  {trip.itinerary.length === 1 ? '' : 's'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''} · {trip.budgetTotal}{' '}
                  {trip.budgetCurrency}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" render={<Link href={`/trips/${trip.id}`} />}>
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(trip.id)}>
                    Duplicate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(trip.id)}>
                    Delete
                  </Button>
                  {trip.shareToken ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={sharingId === trip.id}
                      onClick={() => handleStopSharing(trip)}
                    >
                      Stop sharing
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={sharingId === trip.id}
                      onClick={() => handleShare(trip)}
                    >
                      {sharingId === trip.id ? 'Sharing...' : 'Share'}
                    </Button>
                  )}
                </div>
                {trip.shareToken && (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrlFor(trip) ?? ''}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleCopyLink(trip)}>
                      {copiedId === trip.id ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
