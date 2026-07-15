import { ProtectedRoute } from '@/components/protected-route';
import { AccommodationComparison } from './accommodation-comparison';

export default async function TripAccommodationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <AccommodationComparison tripId={id} />
      </main>
    </ProtectedRoute>
  );
}
