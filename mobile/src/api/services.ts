import type { ApiResponse, Category, Course, CourseInput, PaginatedResponse, User } from '../types';
import { apiClient } from './client';

export const authApi = {
  register: (input: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', input),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
};

export const usersApi = {
  me: () => apiClient.get<ApiResponse<User>>('/users/me'),
  update: (input: { fullName?: string; avatarUrl?: string | null }) =>
    apiClient.patch<ApiResponse<User>>('/users/me', input),
  changePassword: (input: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    apiClient.patch<ApiResponse<null>>('/users/me/password', input),
};

export const categoriesApi = {
  list: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  create: (input: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Category>>('/categories', input),
  update: (id: string, input: { name?: string; description?: string }) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, input),
  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};

export const coursesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Course>>('/courses', { params }),
  detail: (slug: string) => apiClient.get<ApiResponse<Course>>(`/courses/${slug}`),
  managed: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Course>>('/instructor/courses', { params }),
  create: (input: CourseInput) => apiClient.post<ApiResponse<Course>>('/courses', input),
  update: (id: string, input: Partial<CourseInput>) => apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, input),
  publish: (id: string) => apiClient.post<ApiResponse<Course>>(`/courses/${id}/publish`),
  unpublish: (id: string) => apiClient.post<ApiResponse<Course>>(`/courses/${id}/unpublish`),
  remove: (id: string) => apiClient.delete(`/courses/${id}`),
  uploadThumbnail: (id: string, uri: string) => {
    const data = new FormData();
    data.append('thumbnail', { uri, name: 'thumbnail.jpg', type: 'image/jpeg' } as unknown as Blob);
    return apiClient.post<ApiResponse<{ thumbnailUrl: string }>>(`/courses/${id}/thumbnail`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
