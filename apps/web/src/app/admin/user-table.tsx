'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminUserDto, Role } from '@meghjatra/shared';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ROLES: Role[] = ['USER', 'MODERATOR', 'ADMIN'];
const PAGE_SIZE = 24;

export function UserTable() {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadFirstPage = useCallback(
    (searchTerm: string, role: Role | 'all') => {
      if (!accessToken) return;
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (role !== 'all') params.set('role', role);

      Promise.resolve()
        .then(() => {
          setIsLoading(true);
          setError(null);
          return apiClient.get<{ users: AdminUserDto[]; nextCursor: string | null }>(
            `/admin/users?${params.toString()}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
        })
        .then(({ users: fetched, nextCursor: cursor }) => {
          setUsers(fetched);
          setNextCursor(cursor);
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : 'Failed to load users.');
        })
        .finally(() => setIsLoading(false));
    },
    [accessToken],
  );

  useEffect(() => {
    loadFirstPage(search, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, roleFilter]);

  async function loadMore() {
    if (!accessToken || !nextCursor) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), cursor: nextCursor });
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const { users: fetched, nextCursor: cursor } = await apiClient.get<{
        users: AdminUserDto[];
        nextCursor: string | null;
      }>(`/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers((prev) => [...prev, ...fetched]);
      setNextCursor(cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load more users.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function changeRole(user: AdminUserDto, role: Role) {
    if (!accessToken || role === user.role) return;
    setPendingId(user.id);
    setError(null);
    try {
      const { user: updated } = await apiClient.patch<{ user: AdminUserDto }>(
        `/admin/users/${user.id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update role.');
    } finally {
      setPendingId(null);
    }
  }

  async function toggleStatus(user: AdminUserDto) {
    if (!accessToken) return;
    setPendingId(user.id);
    setError(null);
    try {
      const action = user.deletedAt ? 'reactivate' : 'deactivate';
      const { user: updated } = await apiClient.post<{ user: AdminUserDto }>(
        `/admin/users/${user.id}/${action}`,
        undefined,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="user-search">
            Search
          </label>
          <Input
            id="user-search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadFirstPage(search, roleFilter);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Role</label>
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter((value as Role | 'all') ?? 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => loadFirstPage(search, roleFilter)} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">
                  {user.displayName}{' '}
                  {user.deletedAt && <Badge variant="destructive">Deactivated</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value) => changeRole(user, value as Role)}
                  disabled={pendingId === user.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === user.id}
                  onClick={() => toggleStatus(user)}
                >
                  {user.deletedAt ? 'Reactivate' : 'Deactivate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && users.length === 0 && (
          <p className="text-muted-foreground">No users found.</p>
        )}
      </div>

      {nextCursor && (
        <Button variant="outline" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </Button>
      )}
    </div>
  );
}
