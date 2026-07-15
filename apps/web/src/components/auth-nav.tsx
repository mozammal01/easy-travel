'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export function AuthNav() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" render={<Link href="/login" />}>
          Log in
        </Button>
        <Button render={<Link href="/register" />}>Sign up</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Hi, {user.displayName}</span>
      <Button variant="outline" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
