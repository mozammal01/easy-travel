'use client';

import { useState } from 'react';
import { Flag, Star } from 'lucide-react';
import type { ReviewDto, ReviewSort } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'helpful', label: 'Most helpful' },
];

export function ReviewsBoard() {
  const { user, accessToken } = useAuth();
  const [destination, setDestination] = useState('');
  const [searchedDestination, setSearchedDestination] = useState<string | null>(null);
  const [sort, setSort] = useState<ReviewSort>('recent');
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  function fetchReviews(forDestination: string, forSort: ReviewSort) {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ destination: forDestination, sort: forSort });
    apiClient
      .get<{ reviews: ReviewDto[] }>(`/reviews?${params.toString()}`)
      .then(({ reviews: fetched }) => setReviews(fetched))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load reviews.');
        setReviews(null);
      })
      .finally(() => setIsLoading(false));
  }

  function handleSearch() {
    const trimmed = destination.trim();
    if (!trimmed) {
      setError('Enter a destination to search.');
      return;
    }
    setSearchedDestination(trimmed);
    setEditingId(null);
    fetchReviews(trimmed, sort);
  }

  function handleSortChange(value: ReviewSort) {
    setSort(value);
    if (searchedDestination) fetchReviews(searchedDestination, value);
  }

  function startEditing(review: ReviewDto) {
    setEditingId(review.id);
    setFormRating(review.rating);
    setFormText(review.text);
  }

  function cancelEditing() {
    setEditingId(null);
    setFormRating(5);
    setFormText('');
  }

  async function handleSubmit() {
    if (!accessToken || !searchedDestination) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await apiClient.patch(
          `/reviews/${editingId}`,
          { rating: formRating, text: formText },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
      } else {
        await apiClient.post(
          '/reviews',
          { destination: searchedDestination, rating: formRating, text: formText },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
      }
      cancelEditing();
      fetchReviews(searchedDestination, sort);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save your review.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFlag(review: ReviewDto) {
    if (!accessToken) return;
    setFlaggingId(review.id);
    setError(null);
    try {
      await apiClient.post(
        `/reviews/${review.id}/flag`,
        undefined,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setReviews(
        (prev) => prev?.map((r) => (r.id === review.id ? { ...r, flagged: true } : r)) ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to flag review.');
    } finally {
      setFlaggingId(null);
    }
  }

  const ownReview = reviews?.find((r) => r.userId === user?.id) ?? null;
  const showForm = Boolean(searchedDestination && user && (!ownReview || editingId === ownReview.id));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Search a destination</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="review-destination">
              Destination
            </label>
            <Input
              id="review-destination"
              placeholder="e.g. Sylhet"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Sort by</label>
            <Select value={sort} onValueChange={(value) => handleSortChange((value as ReviewSort) ?? 'recent')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Most recent" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searchedDestination && (
        <>
          {!user && (
            <p className="text-sm text-muted-foreground">
              Log in to write a review for {searchedDestination}.
            </p>
          )}

          {user && ownReview && !showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your review</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <StarDisplay rating={ownReview.rating} />
                <p className="text-sm text-muted-foreground">{ownReview.text}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => startEditing(ownReview)}
                >
                  Edit review
                </Button>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? 'Edit your review' : `Write a review for ${searchedDestination}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <StarInput rating={formRating} onChange={setFormRating} />
                <Textarea
                  placeholder="Share details of your own experience (at least 20 characters)..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingId ? 'Save changes' : 'Submit review'}
                  </Button>
                  {editingId && (
                    <Button variant="ghost" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {reviews && reviews.length === 0 && (
            <p className="text-muted-foreground">
              No reviews yet for {searchedDestination}. Be the first to share your experience.
            </p>
          )}

          {reviews && reviews.length > 0 && (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isOwn={review.userId === user?.id}
                  isFlagging={flaggingId === review.id}
                  onFlag={() => handleFlag(review)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  isOwn,
  isFlagging,
  onFlag,
}: {
  review: ReviewDto;
  isOwn: boolean;
  isFlagging: boolean;
  onFlag: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-6">
        <div className="flex items-center justify-between gap-2">
          <StarDisplay rating={review.rating} />
          <div className="flex items-center gap-2">
            {review.flagged && <Badge variant="destructive">Flagged</Badge>}
            {isOwn && <Badge variant="secondary">Your review</Badge>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{review.text}</p>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          {!isOwn && (
            <button
              type="button"
              disabled={review.flagged || isFlagging}
              onClick={onFlag}
              className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Flag className="size-3" />
              {review.flagged ? 'Flagged' : isFlagging ? 'Flagging...' : 'Flag'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            'size-4',
            value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
          )}
        />
      ))}
    </div>
  );
}

function StarInput({ rating, onChange }: { rating: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button key={value} type="button" aria-label={`${value} star`} onClick={() => onChange(value)}>
          <Star
            className={cn(
              'size-5',
              value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  );
}
