import type { Metadata } from 'next';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminDashboard } from './admin-dashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard | MeghJatra',
  description: 'Manage users, destinations, and review moderation.',
};

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, destinations, and moderate flagged reviews.
          </p>
        </div>
        <AdminDashboard />
      </main>
    </ProtectedRoute>
  );
}
