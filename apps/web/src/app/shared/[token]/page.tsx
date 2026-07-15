import type { Metadata } from 'next';
import { SharedItineraryView } from './shared-itinerary-view';

export const metadata: Metadata = {
  title: 'Shared Itinerary | MeghJatra',
  description: 'A trip itinerary shared with you on MeghJatra.',
};

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <SharedItineraryView token={token} />
    </main>
  );
}
