'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import type { FavouriteDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'food', label: 'Food' },
  { value: 'attraction', label: 'Attractions' },
] as const;
type FilterValue = (typeof FILTERS)[number]['value'];

const PAGE_SIZE = 24;

interface WishlistMetadata {
  name?: string;
  description?: string;
  rating?: number;
  priceLevel?: string;
  tags?: string[];
  imageUrl?: string;
  destination?: string;
}

export function WishlistBoard() {
  const { accessToken } = useAuth();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [items, setItems] = useState<FavouriteDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFirstPage = useCallback(
    (activeFilter: FilterValue) => {
      if (!accessToken) return;
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (activeFilter !== 'all') params.set('itemType', activeFilter);

      Promise.resolve()
        .then(() => {
          setIsLoading(true);
          setError(null);
          return apiClient.get<{ favourites: FavouriteDto[]; nextCursor: string | null }>(
            `/favourites?${params.toString()}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
        })
        .then(({ favourites, nextCursor: cursor }) => {
          setItems(favourites);
          setNextCursor(cursor);
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : 'Failed to load your wishlist.');
        })
        .finally(() => setIsLoading(false));
    },
    [accessToken],
  );

  useEffect(() => {
    loadFirstPage(filter);
  }, [filter, loadFirstPage]);

  async function loadMore() {
    if (!accessToken || !nextCursor) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), cursor: nextCursor });
      if (filter !== 'all') params.set('itemType', filter);

      const { favourites, nextCursor: cursor } = await apiClient.get<{
        favourites: FavouriteDto[];
        nextCursor: string | null;
      }>(`/favourites?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setItems((prev) => [...prev, ...favourites]);
      setNextCursor(cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load more items.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleRemove(favourite: FavouriteDto) {
    if (!accessToken) return;
    setRemovingId(favourite.id);
    setError(null);
    try {
      await apiClient.delete(
        `/favourites?itemType=${favourite.itemType}&itemRef=${encodeURIComponent(favourite.itemRef)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setItems((prev) => prev.filter((item) => item.id !== favourite.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove item.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Select value={filter} onValueChange={(value) => setFilter((value as FilterValue) ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {items.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? '' : 's'}
            {nextCursor ? '+' : ''}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading your wishlist...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Heart className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nothing saved yet. Head to{' '}
              <Link href="/discover" className="underline">
                Discover
              </Link>{' '}
              to save food and attractions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((favourite) => (
              <WishlistCard
                key={favourite.id}
                favourite={favourite}
                isRemoving={removingId === favourite.id}
                onRemove={() => handleRemove(favourite)}
              />
            ))}
          </div>

          {nextCursor && (
            <Button variant="outline" onClick={loadMore} disabled={isLoadingMore} className="self-center">
              {isLoadingMore ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function WishlistCard({
  favourite,
  isRemoving,
  onRemove,
}: {
  favourite: FavouriteDto;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const metadata = (favourite.metadata ?? {}) as WishlistMetadata;
  const name = metadata.name ?? favourite.itemRef;

  return (
    <Card className="overflow-hidden">
      {metadata.imageUrl && (
        <div className="h-32 w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={metadata.imageUrl} alt={name} loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {favourite.itemType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {metadata.description && (
          <p className="text-sm text-muted-foreground">{metadata.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {typeof metadata.rating === 'number' && (
            <Badge variant="outline">{metadata.rating.toFixed(1)} ★</Badge>
          )}
          {metadata.priceLevel && <Badge variant="outline">{metadata.priceLevel}</Badge>}
          {metadata.tags?.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {metadata.destination && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/trips/new?destination=${encodeURIComponent(metadata.destination)}`} />
              }
            >
              Plan a trip here
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled={isRemoving} onClick={onRemove}>
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
