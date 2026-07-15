import { ProtectedRoute } from '@/components/protected-route';
import { ItineraryBoard } from './itinerary-board';

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <ItineraryBoard tripId={id} />
      </main>
    </ProtectedRoute>
  );
}
