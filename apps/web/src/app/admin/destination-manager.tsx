'use client';

import { useEffect, useState } from 'react';
import type { DestinationDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
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

const BUDGET_LEVELS = ['budget', 'mid-range', 'luxury'] as const;

interface FormState {
  name: string;
  country: string;
  region: string;
  description: string;
  budgetLevel: string | undefined;
  bestSeason: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  country: '',
  region: '',
  description: '',
  budgetLevel: undefined,
  bestSeason: '',
  tags: '',
};

export function DestinationManager() {
  const { accessToken } = useAuth();
  const [destinations, setDestinations] = useState<DestinationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadDestinations() {
    Promise.resolve()
      .then(() => {
        setError(null);
        return apiClient.get<{ destinations: DestinationDto[] }>('/destinations');
      })
      .then(({ destinations: fetched }) => setDestinations(fetched))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load destinations.');
      });
  }

  useEffect(() => {
    loadDestinations();
  }, []);

  function startEditing(destination: DestinationDto) {
    setEditingId(destination.id);
    setForm({
      name: destination.name,
      country: destination.country,
      region: destination.region ?? '',
      description: destination.description ?? '',
      budgetLevel: destination.budgetLevel ?? undefined,
      bestSeason: destination.bestSeason ?? '',
      tags: destination.tags.join(', '),
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    const body = {
      name: form.name.trim(),
      country: form.country.trim(),
      region: form.region.trim() || undefined,
      description: form.description.trim() || undefined,
      budgetLevel: form.budgetLevel,
      bestSeason: form.bestSeason.trim() || undefined,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) {
        await apiClient.patch(`/destinations/${editingId}`, body, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else {
        await apiClient.post('/destinations', body, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
      cancelEditing();
      loadDestinations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save destination.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(destination: DestinationDto) {
    if (!accessToken) return;
    setDeletingId(destination.id);
    setError(null);
    try {
      await apiClient.delete(`/destinations/${destination.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDestinations((prev) => prev?.filter((d) => d.id !== destination.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete destination.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? 'Edit destination' : 'Add a destination'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
            <Input
              placeholder="Region (optional)"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
            <Input
              placeholder="Best season (optional)"
              value={form.bestSeason}
              onChange={(e) => setForm((f) => ({ ...f, bestSeason: e.target.value }))}
            />
            <Select
              value={form.budgetLevel}
              onValueChange={(value) => setForm((f) => ({ ...f, budgetLevel: value ?? undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Budget level (optional)" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Tags, comma separated"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.country}>
              {isSubmitting ? 'Saving...' : editingId ? 'Save changes' : 'Add destination'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={cancelEditing}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {destinations === null && <p className="text-muted-foreground">Loading destinations...</p>}
        {destinations?.length === 0 && (
          <p className="text-muted-foreground">No destinations yet.</p>
        )}
        {destinations?.map((destination) => (
          <Card key={destination.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">
                  {destination.name}, {destination.country}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {destination.budgetLevel && (
                    <Badge variant="outline">{destination.budgetLevel}</Badge>
                  )}
                  {destination.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEditing(destination)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === destination.id}
                  onClick={() => handleDelete(destination)}
                >
                  {deletingId === destination.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
