export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Course {
  id: string;
  instructorId?: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  language?: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
  status: CourseStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  instructor?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

export interface CourseInput {
  title: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  language: string;
  requirements?: string | null;
  learningOutcomes?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type RootStackParamList = {
  Home: undefined;
  Courses: undefined;
  CourseDetail: { slug: string };
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  InstructorCourses: undefined;
  CourseForm: { course?: Course } | undefined;
  AdminCategories: undefined;
};
