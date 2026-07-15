import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { TripCreationFlow } from './trip-creation-flow';

export default function NewTripPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Plan a new trip</h1>
        <Suspense fallback={null}>
          <TripCreationFlow />
        </Suspense>
      </main>
    </ProtectedRoute>
  );
}
