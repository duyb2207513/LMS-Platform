<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCourseStore } from '@/stores/courses'
import { useAuthStore } from '@/stores/auth'

const courseStore = useCourseStore()
const auth = useAuthStore()
const isLoaded = ref(false)
const featuredTrack = ref<HTMLElement | null>(null)

function scrollFeatured(direction: 'previous' | 'next') {
  const track = featuredTrack.value
  if (!track) return
  track.scrollBy({
    left: direction === 'next' ? track.clientWidth * 0.82 : -track.clientWidth * 0.82,
    behavior: 'smooth',
  })
}

onMounted(async () => {
  try {
    await courseStore.fetchCourses({ limit: 8 })
  } catch (e) {
    console.error('Lỗi tải dữ liệu trang chủ:', e)
  } finally {
    isLoaded.value = true
  }
})
</script>

<template>
  <DefaultLayout>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
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
            <span class="text-sm text-white/90 font-medium">Nền tảng học trực tuyến</span>
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Nâng tầm kiến thức
            <span class="block mt-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              với LMS Platform
            </span>
          </h1>
          <p class="mt-6 text-lg sm:text-xl text-indigo-100 max-w-2xl leading-relaxed">
            Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên hàng đầu. Học mọi lúc, mọi nơi với trải nghiệm hiện đại.
          </p>
          <div class="mt-10 flex flex-wrap gap-4">
            <router-link
              to="/courses"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 hover:bg-purple-600 hover:text-white font-bold text-base shadow-xl transition-all"
            >
              Khám phá ngay
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </router-link>
            <router-link
              v-if="!auth.isLoggedIn"
              to="/register"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-base border border-white/20 hover:bg-purple-600 hover:border-purple-600 transition-all"
            >
              Bắt đầu miễn phí
            </router-link>
          </div>
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
              Các khóa học được yêu thích nhất trên hệ thống
            </p>
          </div>
          <div class="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              class="carousel-button"
              aria-label="Xem các khóa học phía trước"
              @click="scrollFeatured('previous')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              class="carousel-button"
              aria-label="Xem thêm khóa học"
              @click="scrollFeatured('next')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <router-link
              to="/courses"
              class="ml-2 inline-flex items-center gap-2 font-semibold text-slate-700 transition-colors hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-400"
            >
              Xem tất cả
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </router-link>
          </div>
        </div>
        <div v-if="courseStore.loading && !isLoaded" class="py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="!courseStore.courses || courseStore.courses.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">Chưa có khóa học</h3>
          <p class="text-slate-500 mt-2">Các khóa học sẽ sớm được cập nhật</p>
        </div>
        <div
          v-else
          ref="featuredTrack"
          class="featured-track"
          aria-label="Danh sách khóa học nổi bật"
        >
          <div
            v-for="course in (courseStore.courses || []).slice(0, 8)"
            :key="course.id"
            class="featured-slide"
          >
            <CourseCard :course="course" />
          </div>
        </div>
        <router-link
          to="/courses"
          class="mt-7 inline-flex items-center gap-2 font-bold text-purple-700 sm:hidden dark:text-purple-300"
        >
          Xem tất cả khóa học
          <span aria-hidden="true">→</span>
        </router-link>
      </div>
    </section>
  </DefaultLayout>
</template>

<style scoped>
.featured-track {
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 0.25rem 0.125rem 1.25rem;
  overscroll-behavior-inline: contain;
}

.featured-track::-webkit-scrollbar {
  display: none;
}

.featured-slide {
  min-width: min(84vw, 20rem);
  scroll-snap-align: start;
}

.carousel-button {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border: 1px solid #ddd6fe;
  border-radius: 9999px;
  background: #ffffff;
  color: #6d28d9;
  box-shadow: 0 8px 20px -14px #4c1d95;
  transition: 160ms ease;
}

.carousel-button:hover {
  border-color: #7c3aed;
  background: #7c3aed;
  color: #ffffff;
  transform: translateY(-1px);
}

@media (min-width: 640px) {
  .featured-slide {
    min-width: calc((100% - 1.25rem) / 2);
  }
}

@media (min-width: 1024px) {
  .featured-slide {
    min-width: calc((100% - 2.5rem) / 3);
  }
}

@media (min-width: 1280px) {
  .featured-slide {
    min-width: calc((100% - 3.75rem) / 4);
  }
}

:global(.dark) .carousel-button {
  border-color: #4c1d95;
  background: #1e1b4b;
  color: #ddd6fe;
}

:global(.dark) .carousel-button:hover {
  background: #7c3aed;
  color: #ffffff;
}
</style>
