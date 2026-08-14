import axios, { AxiosError, InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ApiResponse } from '../types';
import { API_URL } from './clientConfig';
import { normalizeMediaUrls } from './media';

export { API_URL } from './clientConfig';
export const ACCESS_TOKEN_KEY = 'lms.accessToken';
const CACHE_PREFIX = 'lms.apiCache.';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
let cacheScope = 'guest';

const cacheableRoutes = [
  /^\/categories$/,
  /^\/courses(?:\/[^/]+)?$/,
  /^\/enrollments\/me$/,
  /^\/courses\/[^/]+\/(?:content|progress|reviews|assignments|grades\/me)$/,
  /^\/lessons\/[^/]+\/comments$/,
];

function hash(value: string) {
  let result = 5381;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) + result) ^ value.charCodeAt(index);
  return (result >>> 0).toString(36);
}

function isCacheable(config?: InternalAxiosRequestConfig) {
  return config?.method?.toLowerCase() === 'get' && cacheableRoutes.some(pattern => pattern.test(config.url || ''));
}

function cacheKey(config: InternalAxiosRequestConfig) {
  return `${CACHE_PREFIX}${cacheScope}.${hash(`${config.url || ''}|${JSON.stringify(config.params || {})}`)}`;
}

export function setApiCacheScope(userId?: string | null) { cacheScope = userId ? `user-${hash(userId)}` : 'guest'; }

export async function clearApiCache() {
  const prefix = `${CACHE_PREFIX}${cacheScope}.`;
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(prefix));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  response => {
    response.data = normalizeMediaUrls(response.data);
    if (isCacheable(response.config)) {
      const cached = { data: response.data, status: response.status, statusText: response.statusText, storedAt: Date.now() };
      void AsyncStorage.setItem(cacheKey(response.config), JSON.stringify(cached)).catch(() => undefined);
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') || original?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= apiClient
          .post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token')
          .then(async ({ data }) => {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.data.accessToken);
            return data.data.accessToken;
          })
          .finally(() => { refreshPromise = null; });
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        onSessionExpired?.();
      }
    }
    if (!error.response && original && isCacheable(original)) {
      try {
        const raw = await AsyncStorage.getItem(cacheKey(original));
        if (raw) {
          const cached = JSON.parse(raw) as { data: unknown; status: number; statusText: string; storedAt: number };
          if (Date.now() - cached.storedAt <= CACHE_MAX_AGE_MS) {
            return {
              data: normalizeMediaUrls(cached.data), status: cached.status || 200, statusText: `${cached.statusText || 'OK'} (offline cache)`,
              headers: { 'x-lms-cache': 'stale' }, config: original, request: error.request,
            } as AxiosResponse;
          }
        }
      } catch { /* Corrupted cache should never hide the original network error. */ }
    }
    return Promise.reject(error);
  },
);

export function getApiMessage(error: unknown, fallback = 'Đã có lỗi xảy ra') {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const fields = error.response?.data?.errors;
    if (fields) return Object.values(fields)[0] || fallback;
    return error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Máy chủ phản hồi quá lâu' : fallback);
  }
  return error instanceof Error ? error.message : fallback;
}
