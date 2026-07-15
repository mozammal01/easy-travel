'use client';

import { useEffect, useState } from 'react';
import type { ReviewDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 24;

export function ModerationQueue() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setError(null);
        return apiClient.get<{ reviews: ReviewDto[]; nextCursor: string | null }>(
          `/admin/reviews/flagged?limit=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
      })
      .then(({ reviews: fetched, nextCursor: cursor }) => {
        setReviews(fetched);
        setNextCursor(cursor);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load flagged reviews.');
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  async function loadMore() {
    if (!accessToken || !nextCursor) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const { reviews: fetched, nextCursor: cursor } = await apiClient.get<{
        reviews: ReviewDto[];
        nextCursor: string | null;
      }>(`/admin/reviews/flagged?limit=${PAGE_SIZE}&cursor=${nextCursor}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setReviews((prev) => [...prev, ...fetched]);
      setNextCursor(cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load more reviews.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function resolve(review: ReviewDto) {
    if (!accessToken) return;
    setActingId(review.id);
    setError(null);
    try {
      await apiClient.post(`/admin/reviews/${review.id}/resolve`, undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resolve review.');
    } finally {
      setActingId(null);
    }
  }

  async function remove(review: ReviewDto) {
    if (!accessToken) return;
    setActingId(review.id);
    setError(null);
    try {
      await apiClient.delete(`/admin/reviews/${review.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove review.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading flagged reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground">No flagged reviews. Queue is clear.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex flex-col gap-2 pt-6">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="destructive">Flagged</Badge>
                  <span className="text-xs text-muted-foreground">
                    {review.rating} ★ · {review.destination}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{review.text}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actingId === review.id}
                    onClick={() => resolve(review)}
                  >
                    Resolve (unflag)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actingId === review.id}
                    onClick={() => remove(review)}
                  >
                    Remove review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {nextCursor && (
        <Button variant="outline" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </Button>
      )}
    </div>
  );
}
