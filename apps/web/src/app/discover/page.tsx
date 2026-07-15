import type { Metadata } from 'next';
import { DiscoveryBoard } from './discovery-board';

export const metadata: Metadata = {
  title: 'Discover Food & Attractions | MeghJatra',
  description: 'Find top-rated restaurants and attractions at your destination, one click to save.',
};

export default function DiscoverPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Discover food & attractions</h1>
        <p className="text-muted-foreground">
          Search a destination to find top-rated eats and things to do, and save your favorites.
        </p>
      </div>
      <DiscoveryBoard />
    </main>
  );
}
