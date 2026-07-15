'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, LoginInput, RegisterInput, UserDto } from '@meghjatra/shared';
import { apiClient } from '@/lib/api-client';

interface AuthContextValue {
  user: UserDto | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .post<AuthResponse>('/auth/refresh')
      .then((res) => {
        setUser(res.user);
        setAccessToken(res.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', input);
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', input);
    setUser(res.user);
    setAccessToken(res.accessToken);
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout').catch(() => undefined);
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, isLoading, login, register, logout }),
    [user, accessToken, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
