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
    // Instructor routes
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
      if (auth.isAdmin) return '/admin'
      if (auth.isInstructor) return '/instructor'
      return '/dashboard'
    }
  }
})

export default router