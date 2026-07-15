'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Loader2 } from 'lucide-react';
import type { DayPlanDto, ItineraryItemDto, TripDto } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TIME_BLOCKS = ['morning', 'afternoon', 'evening'] as const;
type TimeBlock = (typeof TIME_BLOCKS)[number];

interface Bucket {
  dayPlanId: string;
  dayIndex: number;
  timeBlock: TimeBlock;
  items: ItineraryItemDto[];
}

function bucketKey(dayPlanId: string, timeBlock: TimeBlock): string {
  return `${dayPlanId}__${timeBlock}`;
}

function buildBuckets(days: DayPlanDto[]): Map<string, Bucket> {
  const buckets = new Map<string, Bucket>();
  for (const day of days) {
    for (const timeBlock of TIME_BLOCKS) {
      buckets.set(bucketKey(day.id, timeBlock), {
        dayPlanId: day.id,
        dayIndex: day.dayIndex,
        timeBlock,
        items: [],
      });
    }
  }
  for (const day of days) {
    for (const item of day.items) {
      buckets.get(bucketKey(day.id, item.timeBlock as TimeBlock))?.items.push(item);
    }
  }
  for (const bucket of buckets.values()) {
    bucket.items.sort((a, b) => a.order - b.order);
  }
  return buckets;
}

function findBucketKeyOf(buckets: Map<string, Bucket>, itemId: string): string | undefined {
  for (const [key, bucket] of buckets) {
    if (bucket.items.some((item) => item.id === itemId)) return key;
  }
  return undefined;
}

function groupBucketsByDay(buckets: Map<string, Bucket>) {
  const days = new Map<
    string,
    { dayPlanId: string; dayIndex: number; sections: Record<TimeBlock, Bucket> }
  >();
  for (const bucket of buckets.values()) {
    let day = days.get(bucket.dayPlanId);
    if (!day) {
      day = {
        dayPlanId: bucket.dayPlanId,
        dayIndex: bucket.dayIndex,
        sections: {} as Record<TimeBlock, Bucket>,
      };
      days.set(bucket.dayPlanId, day);
    }
    day.sections[bucket.timeBlock] = bucket;
  }
  return Array.from(days.values()).sort((a, b) => a.dayIndex - b.dayIndex);
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type PendingUpdate = { dayPlanId: string; timeBlock: TimeBlock; order: number };

const AUTOSAVE_DELAY_MS = 800;

export function ItineraryBoard({ tripId }: { tripId: string }) {
  const { accessToken } = useAuth();
  const [trip, setTrip] = useState<TripDto | null>(null);
  const [buckets, setBuckets] = useState<Map<string, Bucket>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ trip: TripDto }>(`/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(({ trip: fetched }) => {
        setTrip(fetched);
        setBuckets(buildBuckets(fetched.itinerary));
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load trip.');
      });
  }, [accessToken, tripId]);

  const flushSave = useCallback(async () => {
    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();
    if (updates.length === 0) return;

    setSaveStatus('saving');
    try {
      await Promise.all(
        updates.map(([itemId, patch]) =>
          apiClient.patch(`/trips/${tripId}/items/${itemId}`, patch, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ),
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [accessToken, tripId]);

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, AUTOSAVE_DELAY_MS);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setBuckets((prev) => {
      const sourceKey = findBucketKeyOf(prev, activeId);
      if (!sourceKey) return prev;

      const destKey = prev.has(overId) ? overId : (findBucketKeyOf(prev, overId) ?? sourceKey);

      const next = new Map(prev);
      const sourceItems = [...prev.get(sourceKey)!.items];
      const activeIndex = sourceItems.findIndex((item) => item.id === activeId);
      const [moved] = sourceItems.splice(activeIndex, 1);

      const destBucketMeta = prev.get(destKey)!;
      const destItems = sourceKey === destKey ? sourceItems : [...destBucketMeta.items];
      const overIndex = destItems.findIndex((item) => item.id === overId);
      const insertAt = overIndex === -1 ? destItems.length : overIndex;
      destItems.splice(insertAt, 0, { ...moved, timeBlock: destBucketMeta.timeBlock });

      const reindexedDest = destItems.map((item, index) => {
        pendingUpdatesRef.current.set(item.id, {
          dayPlanId: destBucketMeta.dayPlanId,
          timeBlock: destBucketMeta.timeBlock,
          order: index,
        });
        return { ...item, order: index };
      });
      next.set(destKey, { ...destBucketMeta, items: reindexedDest });

      if (sourceKey !== destKey) {
        const sourceBucketMeta = prev.get(sourceKey)!;
        const reindexedSource = sourceItems.map((item, index) => {
          pendingUpdatesRef.current.set(item.id, {
            dayPlanId: sourceBucketMeta.dayPlanId,
            timeBlock: sourceBucketMeta.timeBlock,
            order: index,
          });
          return { ...item, order: index };
        });
        next.set(sourceKey, { ...sourceBucketMeta, items: reindexedSource });
      }

      return next;
    });

    scheduleSave();
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load trip</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (!trip) {
    return <p className="text-muted-foreground">Loading itinerary...</p>;
  }

  const dayGroups = groupBucketsByDay(buckets);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{trip.destination}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(trip.startDate).toLocaleDateString()} –{' '}
            {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dayGroups.map((day) => (
            <Card key={day.dayPlanId}>
              <CardHeader>
                <CardTitle className="text-base">Day {day.dayIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {TIME_BLOCKS.map((timeBlock) => {
                  const bucket = day.sections[timeBlock];
                  const key = bucketKey(day.dayPlanId, timeBlock);
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {timeBlock}
                      </p>
                      <SortableContext
                        items={bucket.items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <DroppableSection id={key}>
                          {bucket.items.map((item) => (
                            <SortableItemCard key={item.id} item={item} />
                          ))}
                        </DroppableSection>
                      </SortableContext>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DroppableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-16 flex-col gap-2 rounded-md border border-dashed p-2 transition-colors',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      {children}
    </div>
  );
}

function SortableItemCard({ item }: { item: ItineraryItemDto }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-md border bg-card p-2 text-sm shadow-sm active:cursor-grabbing"
    >
      <p className="font-medium">{item.activityName}</p>
      <p className="text-xs text-muted-foreground">
        {item.durationMin} min · {item.cost}
      </p>
      {item.tips && <p className="mt-1 text-xs text-muted-foreground">Tip: {item.tips}</p>}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="size-3 animate-spin" /> Saving...
      </Badge>
    );
  }

  if (status === 'saved') {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-500">
        <Check className="size-3" /> Saved
      </Badge>
    );
  }

  return <Badge variant="destructive">Error saving</Badge>;
}
