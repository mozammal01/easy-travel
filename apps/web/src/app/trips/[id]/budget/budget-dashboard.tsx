'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BudgetCategory, BudgetSummary, TripDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  flights: 'var(--chart-1)',
  stay: 'var(--chart-2)',
  food: 'var(--chart-3)',
  activities: 'var(--chart-4)',
  misc: 'var(--chart-5)',
};

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  flights: 'Flights',
  stay: 'Stay',
  food: 'Food',
  activities: 'Activities',
  misc: 'Misc',
};

export function BudgetDashboard({ tripId }: { tripId: string }) {
  const { accessToken } = useAuth();
  const [trip, setTrip] = useState<TripDto | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      apiClient.get<{ trip: TripDto }>(`/trips/${tripId}`, { headers }),
      apiClient.get<{ budget: BudgetSummary }>(`/trips/${tripId}/budget`, { headers }),
    ])
      .then(([tripRes, budgetRes]) => {
        setTrip(tripRes.trip);
        setBudget(budgetRes.budget);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load budget.');
      });
  }, [accessToken, tripId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load budget</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!trip || !budget) {
    return <p className="text-muted-foreground">Loading budget...</p>;
  }

  const pieData = (Object.keys(budget.breakdown) as BudgetCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      value: budget.breakdown[category],
    }))
    .filter((entry) => entry.value > 0);

  const barData = [
    { name: 'Budget', amount: budget.budgetTotal },
    { name: 'Spent', amount: budget.totalSpend },
  ];

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
        <h1 className="text-2xl font-semibold tracking-tight">{trip.destination}</h1>
        <p className="text-sm text-muted-foreground">
          Budget: {budget.budgetTotal} {budget.budgetCurrency}
        </p>
      </div>

      {budget.isOverBudget && (
        <Alert variant="destructive">
          <AlertTitle>Over budget</AlertTitle>
          <AlertDescription>
            You&apos;re projected to spend {budget.overspendPercent}% more than your budget (
            {budget.totalSpend} {budget.budgetCurrency} vs. {budget.budgetTotal}{' '}
            {budget.budgetCurrency}).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
            <CardDescription>How your planned spend breaks down.</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No itemized costs yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} ${budget.budgetCurrency}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget vs. spend</CardTitle>
            <CardDescription>Total planned budget compared to itemized spend.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="fill-muted-foreground text-xs" />
                  <YAxis className="fill-muted-foreground text-xs" />
                  <Tooltip formatter={(value) => `${value} ${budget.budgetCurrency}`} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    <Cell fill="var(--chart-2)" />
                    <Cell fill={budget.isOverBudget ? 'var(--destructive)' : 'var(--chart-4)'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
