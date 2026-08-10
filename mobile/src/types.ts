export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'DOCUMENT';

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

export interface LessonProgress {
  id?: string;
  lessonId?: string;
  isCompleted: boolean;
  lastWatchedSecond: number;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  sectionId?: string;
  title: string;
  lessonType: LessonType;
  content: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  durationSeconds: number | null;
  position: number;
  isPreview: boolean;
  isRequired: boolean;
  isPublished: boolean;
  progress?: LessonProgress;
}

export interface CourseSection {
  id: string;
  courseId?: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  completedAt: string | null;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnailUrl'> & {
    instructor?: Pick<User, 'id' | 'fullName'>;
    category?: Pick<Category, 'id' | 'name' | 'slug'>;
  };
}

export interface CourseContent {
  course: Pick<Course, 'id' | 'title'>;
  sections: CourseSection[];
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
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
  CourseBuilder: { course: Course };
  MyCourses: undefined;
  Learning: { courseId: string; courseTitle: string };
  AdminCategories: undefined;
};
