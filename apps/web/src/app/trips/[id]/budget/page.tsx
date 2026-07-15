import { ProtectedRoute } from '@/components/protected-route';
import { BudgetDashboard } from './budget-dashboard';

export default async function TripBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
        <BudgetDashboard tripId={id} />
      </main>
    </ProtectedRoute>
  );
}
