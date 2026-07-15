'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CURRENCIES, type TripDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const tripFormSchema = z
  .object({
    destination: z.string().min(1, 'Please enter a destination'),
    startDate: z.string().min(1, 'Please select a start date'),
    endDate: z.string().min(1, 'Please select an end date'),
    travelers: z.number().int().positive('Must have at least 1 traveler'),
    budgetTotal: z.number().nonnegative('Budget must be 0 or more'),
    budgetCurrency: z.string().length(3),
    style: z.enum(['relaxed', 'balanced', 'packed']),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
type TripFormValues = z.infer<typeof tripFormSchema>;

const STEPS = ['Destination', 'Dates & Travelers', 'Budget', 'Style & Review'] as const;

const STEP_FIELDS: Record<number, (keyof TripFormValues)[]> = {
  0: ['destination'],
  1: ['startDate', 'endDate', 'travelers'],
  2: ['budgetTotal', 'budgetCurrency'],
  3: ['style'],
};

const STYLE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed', description: '2-3 activities/day' },
  { value: 'balanced', label: 'Balanced', description: '3-4 activities/day' },
  { value: 'packed', label: 'Packed', description: '4-5 activities/day' },
] as const;

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function TripCreationFlow() {
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trip, setTrip] = useState<TripDto | null>(null);

  const today = new Date();
  const defaultStart = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 4 * 24 * 60 * 60 * 1000);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      destination: searchParams.get('destination') ?? '',
      startDate: toDateInputValue(defaultStart),
      endDate: toDateInputValue(defaultEnd),
      travelers: 2,
      budgetTotal: 1000,
      budgetCurrency: 'USD',
      style: 'balanced',
    },
  });

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: TripFormValues) {
    setError(null);
    setIsGenerating(true);
    try {
      const { trip: created } = await apiClient.post<{ trip: TripDto }>('/trips', values, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTrip(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  if (trip) {
    return <GeneratedItinerary trip={trip} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STEPS[step]}</CardTitle>
        <CardDescription>
          Step {step + 1} of {STEPS.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Couldn&apos;t create trip</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {step === 0 && (
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where are you going?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bali, Indonesia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="travelers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travelers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="budgetTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total budget</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip style</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STYLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} — {option.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="font-medium">Review</p>
                  <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
                    <li>Destination: {form.getValues('destination')}</li>
                    <li>
                      Dates: {form.getValues('startDate')} to {form.getValues('endDate')}
                    </li>
                    <li>Travelers: {form.getValues('travelers')}</li>
                    <li>
                      Budget: {form.getValues('budgetTotal')} {form.getValues('budgetCurrency')}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? 'Generating your itinerary...' : 'Generate itinerary'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function GeneratedItinerary({ trip }: { trip: TripDto }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{trip.destination}</CardTitle>
          <CardDescription>
            {new Date(trip.startDate).toLocaleDateString()} –{' '}
            {new Date(trip.endDate).toLocaleDateString()} · {trip.travelers} traveler
            {trip.travelers > 1 ? 's' : ''} · {trip.budgetTotal} {trip.budgetCurrency}
          </CardDescription>
        </CardHeader>
      </Card>

      {trip.itinerary.map((day) => (
        <Card key={day.id}>
          <CardHeader>
            <CardTitle className="text-base">Day {day.dayIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {day.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.activityName}</span>
                  <Badge variant="outline">{item.timeBlock}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.durationMin} min · {item.cost} {trip.budgetCurrency}
                </p>
                {item.tips && <p className="text-sm text-muted-foreground">Tip: {item.tips}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
