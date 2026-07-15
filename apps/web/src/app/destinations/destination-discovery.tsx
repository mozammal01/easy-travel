'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { TRAVEL_INTERESTS, type DestinationRecommendation } from '@meghjatra/shared';
import { apiClient, ApiError } from '@/lib/api-client';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const BUDGET_LEVELS = ['budget', 'mid-range', 'luxury'] as const;

export function DestinationDiscovery() {
  const [interests, setInterests] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [budgetLevel, setBudgetLevel] = useState<string | undefined>(undefined);
  const [durationDays, setDurationDays] = useState('');
  const [results, setResults] = useState<DestinationRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleSearch() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (interests.length > 0) params.set('interests', interests.join(','));
      if (region.trim()) params.set('region', region.trim());
      if (budgetLevel) params.set('budgetLevel', budgetLevel);
      if (durationDays) params.set('durationDays', durationDays);

      const { recommendations } = await apiClient.get<{
        recommendations: DestinationRecommendation[];
      }>(`/recommendations?${params.toString()}`);
      setResults(recommendations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter your search</CardTitle>
          <CardDescription>
            Select your interests and narrow down by region, budget, and trip length.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="region">
                Region
              </label>
              <Input
                id="region"
                placeholder="e.g. Southeast Asia"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="duration">
                Trip length (days)
              </label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={90}
                placeholder="e.g. 7"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="self-start">
            {isLoading ? 'Searching...' : 'Get recommendations'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t fetch recommendations</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((destination) => (
            <DestinationCard
              key={`${destination.destination}-${destination.country}`}
              destination={destination}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DestinationCard({ destination }: { destination: DestinationRecommendation }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <MapPin className="size-10 text-primary/60" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{destination.destination}</CardTitle>
          <Badge variant="secondary">{Math.round(destination.confidence * 100)}% match</Badge>
        </div>
        <CardDescription>{destination.country}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{destination.summary}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{destination.budgetLevel}</Badge>
          <Badge variant="outline">Best: {destination.bestSeason}</Badge>
          {destination.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
