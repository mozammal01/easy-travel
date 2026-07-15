'use client';

import { useEffect, useState } from 'react';
import type { AdminUserDto, DestinationDto, ReviewDto, Role } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ANALYTICS_LIMIT = 100;
const ROLES: Role[] = ['ADMIN', 'MODERATOR', 'USER'];

interface CountStat {
  total: number;
  hasMore: boolean;
}

export function AnalyticsWidgets({ isAdmin }: { isAdmin: boolean }) {
  const { accessToken } = useAuth();
  const [destinationCount, setDestinationCount] = useState<number | null>(null);
  const [flaggedStats, setFlaggedStats] = useState<CountStat | null>(null);
  const [userStats, setUserStats] = useState<(CountStat & { byRole: Record<Role, number> }) | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    apiClient
      .get<{ destinations: DestinationDto[] }>('/destinations')
      .then(({ destinations }) => setDestinationCount(destinations.length))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load destination stats.');
      });

    apiClient
      .get<{ reviews: ReviewDto[]; nextCursor: string | null }>(
        `/admin/reviews/flagged?limit=${ANALYTICS_LIMIT}`,
        { headers },
      )
      .then(({ reviews, nextCursor }) => setFlaggedStats({ total: reviews.length, hasMore: Boolean(nextCursor) }))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load moderation stats.');
      });

    if (isAdmin) {
      apiClient
        .get<{ users: AdminUserDto[]; nextCursor: string | null }>(
          `/admin/users?limit=${ANALYTICS_LIMIT}`,
          { headers },
        )
        .then(({ users, nextCursor }) => {
          const byRole = users.reduce(
            (acc, u) => {
              acc[u.role] = (acc[u.role] ?? 0) + 1;
              return acc;
            },
            {} as Record<Role, number>,
          );
          setUserStats({ total: users.length, hasMore: Boolean(nextCursor), byRole });
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : 'Failed to load user stats.');
        });
    }
  }, [accessToken, isAdmin]);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Some analytics failed to load</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Destinations" value={destinationCount} />
        <StatCard
          label="Flagged reviews"
          value={flaggedStats?.total ?? null}
          suffix={flaggedStats?.hasMore ? '+' : ''}
        />
        {isAdmin && (
          <StatCard
            label="Users"
            value={userStats?.total ?? null}
            suffix={userStats?.hasMore ? '+' : ''}
          />
        )}
      </div>

      {isAdmin && userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by role</CardTitle>
            <CardDescription>
              Based on the {userStats.total} most recently joined users
              {userStats.hasMore ? ' (more exist)' : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Badge key={role} variant="outline">
                {role}: {userStats.byRole[role] ?? 0}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value === null ? '—' : `${value}${suffix}`}</CardTitle>
      </CardHeader>
    </Card>
  );
}
