import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, clearApiCache, clearMobileTokens, refreshMobileAccessToken, saveMobileTokens, setApiCacheScope, setSessionExpiredHandler } from '../api/client';
import { normalizeMediaUrls } from '../api/media';
import { authApi, usersApi } from '../api/services';
import type { User } from '../types';
import { unregisterCurrentPushDevice } from '../notifications/pushDevice';

const USER_KEY = 'lms.user';

interface AuthContextValue {
  user: User | null;
  isBooting: boolean;
  login(email: string, password: string): Promise<User>;
  googleLogin(idToken: string): Promise<User>;
  completeOAuth(code: string): Promise<User>;
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
      clearMobileTokens(),
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
    void (async () => {
      try {
        const [accessToken, refreshToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY), SecureStore.getItemAsync(REFRESH_TOKEN_KEY), SecureStore.getItemAsync(USER_KEY),
        ]);
        if (!savedUser || (!accessToken && !refreshToken)) return;
        if (!accessToken && refreshToken) await refreshMobileAccessToken();
        const restoredUser = normalizeMediaUrls(JSON.parse(savedUser) as User);
        setApiCacheScope(restoredUser.id);
        setUserState(restoredUser);
      } catch { await clearSession(); }
      finally { setBooting(false); }
    })();
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    await saveMobileTokens(data.data.accessToken, data.data.refreshToken);
    await setUser(data.data.user);
    return data.data.user;
  }, [setUser]);

  const googleLogin = useCallback(async (idToken: string) => {
    const { data } = await authApi.googleLogin(idToken);
    await saveMobileTokens(data.data.accessToken, data.data.refreshToken);
    await setUser(data.data.user);
    return data.data.user;
  }, [setUser]);

  const completeOAuth = useCallback(async (code: string) => {
    const { data } = await authApi.exchangeOAuth(code);
    await saveMobileTokens(data.data.accessToken, data.data.refreshToken);
    await setUser(data.data.user);
    return data.data.user;
  }, [setUser]);

  const register = useCallback(async (input: { fullName: string; email: string; password: string; confirmPassword: string }) => {
    await authApi.register(input);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    try { await unregisterCurrentPushDevice(); if (refreshToken) await authApi.logout(refreshToken); } finally { await clearSession(); }
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const { data } = await usersApi.me();
    await setUser(data.data);
    return data.data;
  }, [setUser]);

  const value = useMemo(() => ({ user, isBooting, login, googleLogin, completeOAuth, register, logout, refreshProfile, setUser }),
    [user, isBooting, login, googleLogin, completeOAuth, register, logout, refreshProfile, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
