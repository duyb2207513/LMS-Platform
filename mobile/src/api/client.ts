import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiResponse } from '../types';
import { API_URL } from './clientConfig';
import { normalizeMediaUrls } from './media';

export { API_URL } from './clientConfig';
export const ACCESS_TOKEN_KEY = 'lms.accessToken';

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
