import type { Metadata } from 'next';
import { ProtectedRoute } from '@/components/protected-route';
import { WishlistBoard } from './wishlist-board';

export const metadata: Metadata = {
  title: 'My Wishlist | MeghJatra',
  description: 'Food and attractions you have saved for your next trip.',
};

export default function FavouritesPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">My wishlist</h1>
          <p className="text-muted-foreground">
            Everything you&apos;ve saved from Discover, in one place.
          </p>
        </div>
        <WishlistBoard />
      </main>
    </ProtectedRoute>
  );
}
