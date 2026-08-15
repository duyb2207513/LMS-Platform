import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    // Public routes
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { guest: true },
    },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/pages/ForgotPasswordPage.vue'), meta: { guest: true } },
    { path: '/reset-password', name: 'reset-password', component: () => import('@/pages/ResetPasswordPage.vue'), meta: { guest: true } },
    { path: '/verify-email', name: 'verify-email', component: () => import('@/pages/VerifyEmailPage.vue') },
    { path: '/confirm-email-change', name: 'confirm-email-change', component: () => import('@/pages/ConfirmEmailChangePage.vue') },
    { path: '/auth/github/callback', name: 'github-callback', component: () => import('@/pages/GitHubCallbackPage.vue') },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('@/pages/CourseCatalog.vue'),
    },
    {
      path: '/courses/:slug',
      name: 'course-detail',
      component: () => import('@/pages/CourseDetail.vue'),
    },
    // Student routes
    {
      path: '/dashboard',
      name: 'student-dashboard',
      component: () => import('@/pages/student/DashboardPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.STUDENT] },
    },
    { path: '/403', name: 'forbidden', component: () => import('@/pages/ForbiddenPage.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/pages/student/ProfilePage.vue'), meta: { requiresAuth: true } },
    { path: '/change-password', name: 'change-password', component: () => import('@/pages/student/ChangePasswordPage.vue'), meta: { requiresAuth: true } },
    { path: '/security', name: 'security', component: () => import('@/pages/student/SecurityPage.vue'), meta: { requiresAuth: true } },
    { path: '/my-courses', name: 'my-courses', component: () => import('@/pages/student/MyCoursesPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/courses/:courseId/assignments', name: 'student-assignments', component: () => import('@/pages/student/CourseAssignmentsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/assignments/:assignmentId', name: 'student-assignment-detail', component: () => import('@/pages/student/AssignmentDetailPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/learn/:courseId', name: 'learning', component: () => import('@/pages/student/LearningPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/quiz/:quizId', name: 'take-quiz', component: () => import('@/pages/student/QuizPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/quiz-result', name: 'quiz-result', component: () => import('@/pages/student/QuizResultPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/orders', name: 'orders', component: () => import('@/pages/student/OrdersPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/checkout/:orderId', name: 'checkout', component: () => import('@/pages/student/CheckoutPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/payment-result/:orderId', name: 'payment-result', component: () => import('@/pages/student/PaymentResultPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/notifications', name: 'notifications', component: () => import('@/pages/NotificationCenterPage.vue'), meta: { requiresAuth: true } },
    { path: '/notifications/settings', name: 'notification-settings', component: () => import('@/pages/NotificationSettingsPage.vue'), meta: { requiresAuth: true } },
    { path: '/courses/:courseId/announcements', name: 'course-announcements', component: () => import('@/pages/student/CourseAnnouncementsPage.vue'), meta: { requiresAuth: true } },
    { path: '/courses/:courseId/announcements/:announcementId', name: 'course-announcement-detail', component: () => import('@/pages/student/AnnouncementDetailPage.vue'), meta: { requiresAuth: true } },
    { path: '/certificates', name: 'certificates', component: () => import('@/pages/student/CertificatesPage.vue'), meta: { requiresAuth: true, roles: [UserRole.STUDENT] } },
    { path: '/certificates/verify/:code?', name: 'verify-certificate', component: () => import('@/pages/VerifyCertificatePage.vue') },
    // Instructor routes
    { path: '/instructor/courses/:courseId/announcements', name: 'instructor-announcements', component: () => import('@/pages/instructor/CourseAnnouncementsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    {
      path: '/instructor',
      name: 'instructor-dashboard',
      component: () => import('@/pages/instructor/DashboardPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR] },
    },
    {
      path: '/instructor/courses',
      name: 'instructor-courses',
      component: () => import('@/pages/instructor/MyCoursesPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR] },
    },
    {
      path: '/instructor/courses/create',
      name: 'instructor-create-course',
      component: () => import('@/pages/instructor/CreateCoursePage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR] },
    },
    {
      path: '/instructor/courses/:id/edit',
      name: 'instructor-edit-course',
      component: () => import('@/pages/instructor/EditCoursePage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR] },
    },
    { path: '/instructor/courses/:courseId/builder', name: 'course-builder', component: () => import('@/pages/instructor/CourseBuilderPage.vue'), meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    { path: '/instructor/courses/:courseId/assignments', name: 'assignment-builder', component: () => import('@/pages/instructor/AssignmentsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    { path: '/instructor/assignments/:assignmentId/submissions', name: 'assignment-submissions', component: () => import('@/pages/instructor/AssignmentSubmissionsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    { path: '/instructor/lessons/:lessonId/quiz', name: 'quiz-builder', component: () => import('@/pages/instructor/QuizBuilderPage.vue'), meta: { requiresAuth: true, roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] } },
    // Admin routes
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/pages/admin/DashboardPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.ADMIN] },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('@/pages/admin/CategoriesPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.ADMIN] },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/pages/admin/UsersPage.vue'),
      meta: { requiresAuth: true, roles: [UserRole.ADMIN] },
    },
    { path: '/admin/courses', name: 'admin-courses', component: () => import('@/pages/admin/CoursesPage.vue'), meta: { requiresAuth: true, roles: [UserRole.ADMIN] } },
    { path: '/admin/reviews', name: 'admin-reviews', component: () => import('@/pages/admin/ReviewsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.ADMIN] } },
    { path: '/admin/comments', name: 'admin-comments', component: () => import('@/pages/admin/CommentsPage.vue'), meta: { requiresAuth: true, roles: [UserRole.ADMIN] } },

    // Catch all
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation guards
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Tự động khôi phục phiên đăng nhập từ localStorage trước khi kiểm tra quyền
  if (!auth.isLoggedIn && localStorage.getItem('accessToken')) {
    auth.initialize()
  }

  // Redirect guests away from auth pages if logged in
  if (to.meta.guest && auth.isLoggedIn) {
    if (auth.isAdmin) return '/admin'
    if (auth.isInstructor) return '/instructor'
    return '/dashboard'
  }

  // Redirect to login if auth required
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Check role access
  if (to.meta.roles && auth.user) {
    const allowedRoles = to.meta.roles as UserRole[]
    if (!allowedRoles.includes(auth.user.role)) {
      return '/403'
    }
  }
})

export default router
