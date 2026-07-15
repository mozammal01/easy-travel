import type { Metadata } from 'next';
import { DestinationDiscovery } from './destination-discovery';

export const metadata: Metadata = {
  title: 'Discover Destinations | MeghJatra',
  description:
    'Get AI-recommended travel destinations tailored to your interests, budget, and trip length.',
};

export default function DestinationsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Discover your next trip</h1>
        <p className="text-muted-foreground">
          Tell us what you like, and we&apos;ll recommend destinations tailored to you.
        </p>
      </div>
      <DestinationDiscovery />
    </main>
  );
}
