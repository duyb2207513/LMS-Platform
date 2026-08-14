import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ACCESS_TOKEN_KEY, clearApiCache, setApiCacheScope, setSessionExpiredHandler } from '../api/client';
import { normalizeMediaUrls } from '../api/media';
import { authApi, usersApi } from '../api/services';
import type { User } from '../types';

const USER_KEY = 'lms.user';

interface AuthContextValue {
  user: User | null;
  isBooting: boolean;
  login(email: string, password: string): Promise<User>;
  register(input: { fullName: string; email: string; password: string; confirmPassword: string }): Promise<void>;
  logout(): Promise<void>;
  refreshProfile(): Promise<User>;
  setUser(user: User): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isBooting, setBooting] = useState(true);

  const clearSession = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      clearApiCache().catch(() => undefined),
    ]);
    setApiCacheScope(null);
    setUserState(null);
  }, []);

  const setUser = useCallback(async (nextUser: User) => {
    const normalizedUser = normalizeMediaUrls(nextUser);
    setApiCacheScope(normalizedUser.id);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(normalizedUser));
    setUserState(normalizedUser);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => { void clearSession(); });
    Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]).then(([token, savedUser]) => {
      if (token && savedUser) {
        try { const restoredUser = normalizeMediaUrls(JSON.parse(savedUser) as User); setApiCacheScope(restoredUser.id); setUserState(restoredUser); } catch { void clearSession(); }
      }
    }).finally(() => setBooting(false));
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.data.accessToken);
    await setUser(data.data.user);
    return data.data.user;
  }, [setUser]);

  const register = useCallback(async (input: { fullName: string; email: string; password: string; confirmPassword: string }) => {
    await authApi.register(input);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { await clearSession(); }
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const { data } = await usersApi.me();
    await setUser(data.data);
    return data.data;
  }, [setUser]);

  const value = useMemo(() => ({ user, isBooting, login, register, logout, refreshProfile, setUser }),
    [user, isBooting, login, register, logout, refreshProfile, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
