'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { TRAVEL_INTERESTS, type DiscoveryCategory, type DiscoveryItemDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

const BUDGET_LEVELS = ['budget', 'mid-range', 'luxury'] as const;
const CATEGORIES: { value: DiscoveryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Food & attractions' },
  { value: 'food', label: 'Food only' },
  { value: 'attraction', label: 'Attractions only' },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function itemRefFor(destination: string, item: DiscoveryItemDto): string {
  return slugify(`${destination}__${item.category}__${item.name}`);
}

export function DiscoveryBoard() {
  const { user, accessToken } = useAuth();
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState<DiscoveryCategory | 'all'>('all');
  const [interests, setInterests] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<DiscoveryItemDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favouriteRefs, setFavouriteRefs] = useState<Set<string>>(new Set());
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;
    apiClient
      .get<{ favourites: { itemRef: string }[] }>('/favourites?limit=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(({ favourites }) => setFavouriteRefs(new Set(favourites.map((f) => f.itemRef))))
      .catch(() => {
        /* wishlist state is a nice-to-have; ignore load failures */
      });
  }, [user, accessToken]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleSearch() {
    if (!destination.trim()) {
      setError('Enter a destination to search.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ destination: destination.trim() });
      if (category !== 'all') params.set('category', category);
      if (interests.length > 0) params.set('interests', interests.join(','));
      if (budgetLevel) params.set('budgetLevel', budgetLevel);

      const { items } = await apiClient.get<{ items: DiscoveryItemDto[] }>(
        `/discovery?${params.toString()}`,
      );
      setResults(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFavourite(item: DiscoveryItemDto) {
    if (!user || !accessToken) return;
    const ref = itemRefFor(destination.trim(), item);
    const isFavourited = favouriteRefs.has(ref);
    setPendingRef(ref);
    try {
      if (isFavourited) {
        await apiClient.delete(
          `/favourites?itemType=${item.category}&itemRef=${encodeURIComponent(ref)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setFavouriteRefs((prev) => {
          const next = new Set(prev);
          next.delete(ref);
          return next;
        });
      } else {
        await apiClient.post(
          '/favourites',
          { itemType: item.category, itemRef: ref, metadata: { ...item, destination: destination.trim() } },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        setFavouriteRefs((prev) => new Set(prev).add(ref));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update favourites.');
    } finally {
      setPendingRef(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {user && (
        <Button variant="ghost" size="sm" className="self-end" render={<Link href="/favourites" />}>
          View my wishlist
        </Button>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Search a destination</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-sm font-medium" htmlFor="destination">
                Destination
              </label>
              <Input
                id="destination"
                placeholder="e.g. Cox's Bazar"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onValueChange={(value) => setCategory((value as DiscoveryCategory | 'all') ?? 'all')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Food & attractions" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Budget</label>
              <Select value={budgetLevel} onValueChange={(value) => setBudgetLevel(value ?? undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any budget" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Interests</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRAVEL_INTERESTS.map((interest) => (
                <label key={interest} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={interests.includes(interest)}
                    onCheckedChange={() => toggleInterest(interest)}
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="self-start">
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load results</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => {
            const ref = itemRefFor(destination.trim(), item);
            return (
              <DiscoveryCard
                key={ref}
                item={item}
                isFavourited={favouriteRefs.has(ref)}
                isPending={pendingRef === ref}
                canFavourite={Boolean(user)}
                onToggleFavourite={() => toggleFavourite(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiscoveryCard({
  item,
  isFavourited,
  isPending,
  canFavourite,
  onToggleFavourite,
}: {
  item: DiscoveryItemDto;
  isFavourited: boolean;
  isPending: boolean;
  canFavourite: boolean;
  onToggleFavourite: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          aria-label={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
          disabled={!canFavourite || isPending}
          onClick={onToggleFavourite}
          title={canFavourite ? undefined : 'Log in to save favourites'}
          className={cn(
            'absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <Heart
            className={cn('size-4', isFavourited ? 'fill-destructive text-destructive' : 'text-foreground')}
          />
        </button>
      </div>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{item.name}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {item.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{item.rating.toFixed(1)} ★</Badge>
          <Badge variant="outline">{item.priceLevel}</Badge>
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
