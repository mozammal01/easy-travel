'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { UserTable } from './user-table';
import { DestinationManager } from './destination-manager';
import { ModerationQueue } from './moderation-queue';
import { AnalyticsWidgets } from './analytics-widgets';

type Section = 'analytics' | 'users' | 'destinations' | 'moderation';

export function AdminDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('analytics');

  const isAdmin = user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR';

  if (!isAdmin && !isModerator) {
    return <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>;
  }

  const sections: { value: Section; label: string }[] = [
    { value: 'analytics', label: 'Analytics' },
    ...(isAdmin
      ? ([
          { value: 'users', label: 'Users' },
          { value: 'destinations', label: 'Destinations' },
        ] as const)
      : []),
    { value: 'moderation', label: 'Moderation' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <Button
            key={s.value}
            variant={section === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSection(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {section === 'analytics' && <AnalyticsWidgets isAdmin={isAdmin} />}
      {section === 'users' && isAdmin && <UserTable />}
      {section === 'destinations' && isAdmin && <DestinationManager />}
      {section === 'moderation' && <ModerationQueue />}
    </div>
  );
}
