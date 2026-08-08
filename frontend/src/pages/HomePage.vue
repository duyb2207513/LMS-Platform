<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCourseStore } from '@/stores/courses'
import { useCategoryStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'

const courseStore = useCourseStore()
const categoryStore = useCategoryStore()
const auth = useAuthStore()
const isLoaded = ref(false)

onMounted(async () => {
  await Promise.all([
    courseStore.fetchCourses({ limit: 8 }),
    categoryStore.fetchCategories(),
  ])
  isLoaded.value = true
})
</script>

<template>
  <DefaultLayout>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
      <!-- Background Pattern -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div class="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
      </div>

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span class="text-sm text-white/90 font-medium">Nền tảng học trực tuyến hàng đầu</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Nâng tầm kiến thức
            <span class="block mt-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              với LMS Platform
            </span>
          </h1>

          <p class="mt-6 text-lg sm:text-xl text-indigo-100 max-w-2xl leading-relaxed">
            Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên hàng đầu. 
            Học mọi lúc, mọi nơi với trải nghiệm học tập hiện đại.
          </p>

          <div class="mt-10 flex flex-wrap gap-4">
            <router-link
              to="/courses"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-base shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              Khám phá khóa học
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </router-link>
            <router-link
              v-if="!auth.isLoggedIn"
              to="/register"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-base border border-white/20 hover:bg-white/20 transition-all"
            >
              Bắt đầu miễn phí
            </router-link>
          </div>

          <!-- Stats -->
          <div class="mt-16 grid grid-cols-3 gap-8 max-w-lg">
            <div>
              <p class="text-3xl sm:text-4xl font-extrabold text-white">100+</p>
              <p class="text-sm text-indigo-200 mt-1">Khóa học</p>
            </div>
            <div>
              <p class="text-3xl sm:text-4xl font-extrabold text-white">50+</p>
              <p class="text-sm text-indigo-200 mt-1">Giảng viên</p>
            </div>
            <div>
              <p class="text-3xl sm:text-4xl font-extrabold text-white">1K+</p>
              <p class="text-sm text-indigo-200 mt-1">Học viên</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="py-16 sm:py-20 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Danh mục phổ biến
          </h2>
          <p class="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Tìm kiếm khóa học theo lĩnh vực bạn quan tâm
          </p>
        </div>

        <div v-if="categoryStore.loading" class="py-8">
          <LoadingSpinner />
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <router-link
            v-for="category in categoryStore.categories.slice(0, 8)"
            :key="category.id"
            :to="`/courses?categoryId=${category.id}`"
            class="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
          >
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors" />
            <div class="relative">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 class="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {{ category.name }}
              </h3>
              <p v-if="category._count" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {{ category._count.courses }} khóa học
              </p>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Featured Courses -->
    <section class="py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-12">
          <div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Khóa học nổi bật
            </h2>
            <p class="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Các khóa học được yêu thích nhất trên nền tảng
            </p>
          </div>
          <router-link
            to="/courses"
            class="hidden sm:inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Xem tất cả
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
        </div>

        <div v-if="courseStore.loading && !isLoaded" class="py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="courseStore.courses.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 class="text-xl font-semibold text-slate-700">Chưa có khóa học nào</h3>
          <p class="text-slate-500 mt-2">Các khóa học sẽ được cập nhật sớm</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CourseCard
            v-for="course in courseStore.courses"
            :key="course.id"
            :course="course"
          />
        </div>

        <!-- Mobile View All -->
        <div class="mt-8 text-center sm:hidden">
          <router-link
            to="/courses"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            Xem tất cả khóa học
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
      <div class="absolute inset-0">
        <div class="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div class="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
      </div>
      <div class="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white">
          Bạn là giảng viên? Hãy chia sẻ kiến thức!
        </h2>
        <p class="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
          Tạo khóa học trực tuyến và chia sẻ kiến thức của bạn với hàng ngàn học viên trên toàn quốc.
        </p>
        <router-link
          to="/register"
          class="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          Đăng ký làm giảng viên
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </router-link>
      </div>
    </section>
  </DefaultLayout>
</template>
