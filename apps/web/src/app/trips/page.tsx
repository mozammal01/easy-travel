import { ProtectedRoute } from '@/components/protected-route';
import { TripDashboard } from './trip-dashboard';

export default function TripsPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <TripDashboard />
      </main>
    </ProtectedRoute>
  );
}
