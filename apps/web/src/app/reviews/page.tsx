import type { Metadata } from 'next';
import { ReviewsBoard } from './reviews-board';

export const metadata: Metadata = {
  title: 'Traveler Reviews | MeghJatra',
  description: 'Read and write reviews for destinations from fellow travelers.',
};

export default function ReviewsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Traveler reviews</h1>
        <p className="text-muted-foreground">
          Search a destination to read reviews, or share your own experience.
        </p>
      </div>
      <ReviewsBoard />
    </main>
  );
}
