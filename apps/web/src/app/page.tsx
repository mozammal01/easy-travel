import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthNav } from '@/components/auth-nav';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">MeghJatra</h1>
        <div className="flex items-center gap-3">
          <AuthNav />
          <ThemeToggle />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where do you want to go?</CardTitle>
          <CardDescription>
            AI-recommended destinations, day-by-day itineraries, and budget tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Input placeholder="e.g. beach, budget-friendly, 5 days" />
          <Button>Get recommendations</Button>
        </CardContent>
      </Card>
    </main>
  );
}
