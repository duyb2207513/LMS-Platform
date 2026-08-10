import type {
  ApiResponse, Category, Course, CourseContent, CourseInput, CourseProgress,
  CourseSection, Enrollment, Lesson, LessonType, PaginatedResponse, User,
} from '../types';
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

export const sectionsApi = {
  list: (courseId: string) => apiClient.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`),
  create: (courseId: string, input: { title: string; position?: number }) =>
    apiClient.post<ApiResponse<CourseSection>>(`/courses/${courseId}/sections`, input),
  update: (sectionId: string, input: { title?: string; position?: number }) =>
    apiClient.patch<ApiResponse<CourseSection>>(`/sections/${sectionId}`, input),
  remove: (sectionId: string) => apiClient.delete(`/sections/${sectionId}`),
};

export interface LessonInput {
  title: string;
  lessonType: LessonType;
  content?: string | null;
  durationSeconds?: number | null;
  position?: number;
  isPreview?: boolean;
  isRequired?: boolean;
  isPublished?: boolean;
}

export const lessonsApi = {
  create: (sectionId: string, input: LessonInput) =>
    apiClient.post<ApiResponse<Lesson>>(`/sections/${sectionId}/lessons`, input),
  update: (lessonId: string, input: Partial<LessonInput>) =>
    apiClient.patch<ApiResponse<Lesson>>(`/lessons/${lessonId}`, input),
  remove: (lessonId: string) => apiClient.delete(`/lessons/${lessonId}`),
  uploadFile: (lessonId: string, file: { uri: string; name: string; mimeType?: string | null }) => {
    const data = new FormData();
    data.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as unknown as Blob);
    return apiClient.post<ApiResponse<Lesson>>(`/lessons/${lessonId}/file`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const enrollmentsApi = {
  enroll: (courseId: string) => apiClient.post<ApiResponse<Enrollment>>(`/courses/${courseId}/enroll`),
  mine: () => apiClient.get<ApiResponse<Enrollment[]>>('/enrollments/me'),
};

export const learningApi = {
  content: (courseId: string) => apiClient.get<ApiResponse<CourseContent>>(`/courses/${courseId}/content`),
  progress: (courseId: string) => apiClient.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`),
  updateProgress: (lessonId: string, input: { lastWatchedSecond?: number; isCompleted?: boolean }) =>
    apiClient.patch<ApiResponse<{ lessonProgress: Lesson['progress']; courseProgress: CourseProgress }>>(`/lessons/${lessonId}/progress`, input),
};
