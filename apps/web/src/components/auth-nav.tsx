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
      <Button variant="ghost" render={<Link href="/trips" />}>
        My trips
      </Button>
      <Button variant="ghost" render={<Link href="/favourites" />}>
        Wishlist
      </Button>
      {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
        <Button variant="ghost" render={<Link href="/admin" />}>
          Admin
        </Button>
      )}
      <Button variant="ghost" render={<Link href="/profile" />}>
        Hi, {user.displayName}
      </Button>
      <Button variant="outline" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
