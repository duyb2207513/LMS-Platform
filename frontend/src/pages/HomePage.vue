<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const featuredTrack = ref<HTMLElement | null>(null)
const selectedCategory = ref<string>('all')

function scrollFeatured(direction: 'previous' | 'next') {
  const track = featuredTrack.value
  if (!track) return
  track.scrollBy({
    left: direction === 'next' ? track.clientWidth * 0.82 : -track.clientWidth * 0.82,
    behavior: 'smooth',
  })
}

const filteredCourses = computed(() => {
  const list = courseStore.courses || []
  if (selectedCategory.value === 'all') return list
  return list.filter((c) => c.categoryId === selectedCategory.value || c.category?.id === selectedCategory.value)
})

const totalCourses = computed(() => courseStore.meta?.total || courseStore.courses?.length || 0)
const totalCategories = computed(() => categoryStore.categories?.length || 0)
const freeCoursesCount = computed(() => (courseStore.courses || []).filter((c) => c.isFree).length)

const dynamicStats = computed(() => [
  {
    value: totalCourses.value ? `${totalCourses.value} Khóa` : '0 Khóa',
    label: 'Khóa học sẵn sàng',
    desc: 'Được biên soạn bài bản & chi tiết',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    value: totalCategories.value ? `${totalCategories.value} Chủ đề` : '0 Chủ đề',
    label: 'Chuyên môn đào tạo',
    desc: 'Web, Mobile, AI, DevOps & Database',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    value: freeCoursesCount.value ? `${freeCoursesCount.value} Khóa 0đ` : 'Miễn phí',
    label: 'Học thử miễn phí',
    desc: 'Bắt đầu học ngay không cần trả phí',
    icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  },
  {
    value: 'Gemini 3.5',
    label: 'AI Flash đồng hành',
    desc: 'Giải đáp thắc mắc lập trình tức thì',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
])

const features = [
  {
    tag: 'AI Powered',
    title: 'Trợ lý ảo AI Gemini 3.5 Flash',
    desc: 'Trợ lý ảo thông minh đồng hành và hỗ trợ học tập 24/7.',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    borderGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    colSpan: 'lg:col-span-2',
  },
  {
    tag: 'Interactive Video',
    title: 'Học tương tác đa phương tiện',
    desc: 'Video chuẩn HD kèm tài liệu PDF/Word tải trực tiếp, tự động lưu tiến độ từng giây học.',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    borderGlow: 'hover:border-sky-500/50 hover:shadow-sky-500/10',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    colSpan: 'lg:col-span-1',
  },
  {
    tag: 'Hands-on Coding',
    title: 'Luyện tập Quiz & Nộp bài tập',
    desc: 'Kiểm tra trắc nghiệm chấm điểm tức thì và nộp file bài tập được Giảng viên phản hồi chấm điểm chi tiết.',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    borderGlow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    colSpan: 'lg:col-span-1',
  },
  {
    tag: 'Verification',
    title: 'Chứng chỉ số định danh công khai',
    desc: 'Nhận chứng chỉ số có mã xác minh duy nhất ngay khi hoàn thành 100% nội dung khóa học để gắn vào CV.',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    borderGlow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    colSpan: 'lg:col-span-2',
  },
]

const learningSteps = [
  { step: '01', title: 'Chọn khóa học mong muốn', desc: 'Dễ dàng lọc theo chủ đề Lập trình Web, Mobile, AI, DevOps hay Cơ sở dữ liệu.' },
  { step: '02', title: 'Học tập & Thực hành cùng AI', desc: 'Xem video, làm Quiz tương tác và trao đổi câu hỏi trực tiếp với AI Gemini.' },
  { step: '03', title: 'Nộp bài tập & Nhận chứng chỉ', desc: 'Nhận phản hồi từ giảng viên, tích lũy điểm số và nhận chứng chỉ xác thực.' },
]

onMounted(async () => {
  try {
    await Promise.allSettled([
      courseStore.fetchCourses({ limit: 12 }),
      categoryStore.fetchCategories(),
    ])
  } catch (e) {
    console.error('Lỗi tải dữ liệu trang chủ:', e)
  } finally {
    isLoaded.value = true
  }
})
</script>

<template>
  <DefaultLayout>
    <!-- HERO SECTION WITH AMBIENT MOTION -->
    <section class="hero-wrapper relative overflow-hidden bg-slate-950 text-white pt-24 pb-28 sm:pt-32 sm:pb-36 lg:pt-36 lg:pb-44">
      <!-- Animated Background Aurora Orbs -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="aurora-orb orb-1 absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-violet-600/40 to-indigo-500/30 blur-[120px]" />
        <div class="aurora-orb orb-2 absolute top-1/4 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-600/35 to-pink-500/25 blur-[140px]" />
        <div class="aurora-orb orb-3 absolute -bottom-32 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-r from-blue-600/30 to-teal-500/20 blur-[130px]" />
        <!-- Tech Matrix Grid Overlay -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <!-- Left Column: Copy & Actions -->
          <div class="lg:col-span-7">
            <!-- Shimmer Pill Badge -->
            <div class="inline-flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md shadow-xs shadow-purple-500/10 mb-8 transition hover:border-purple-400">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
              </span>
              <span>LMS Platform • Hệ thống Micro-module & AI Gemini 3.5 Flash</span>
            </div>

            <!-- Main Heading with Dynamic Gradient -->
            <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl/tight">
              Bứt phá sự nghiệp
              <span class="block mt-1 bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                với Nền tảng Học tập Toàn diện
              </span>
            </h1>

            <p class="mt-6 text-base text-slate-300 sm:text-lg lg:text-xl max-w-2xl font-normal leading-relaxed">
              Khám phá các khóa học lập trình thực chiến từ cơ bản đến nâng cao. Học tập linh hoạt với video sắc nét, bài tập tự chấm và trợ lý AI thông minh đồng hành 24/7.
            </p>

            <!-- CTA Action Buttons -->
            <div class="mt-10 flex flex-wrap items-center gap-4">
              <RouterLink
                to="/courses"
                class="shimmer-btn group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-purple-600/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/40 active:scale-[0.98]"
              >
                <span>Khám phá khóa học</span>
                <svg class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </RouterLink>

              <RouterLink
                v-if="!auth.isLoggedIn"
                to="/login"
                class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/40 active:scale-[0.98]"
              >
                <span>Dùng thử tài khoản Demo</span>
              </RouterLink>
            </div>

            <!-- Trust Meta with Real Tech Stack -->
            <div class="mt-12 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8 text-xs font-semibold text-slate-400">
              <span class="text-slate-300">Công nghệ nền tảng:</span>
              <span class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-purple-300">Node.js 22 Express</span>
              <span class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-sky-300">Vue 3 + Vite</span>
              <span class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-emerald-300">PostgreSQL 17 Supabase</span>
              <span class="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-pink-300">Google Gemini 3.5 Flash</span>
            </div>
          </div>

          <!-- Right Column: Interactive 3D Glass Dashboard Mockup -->
          <div class="lg:col-span-5">
            <div class="hero-mockup-container relative mx-auto max-w-md lg:max-w-none">
              <!-- Main Glass Dashboard Card -->
              <div class="relative rounded-2xl border border-white/20 bg-slate-900/80 p-6 shadow-2xl shadow-purple-950/50 backdrop-blur-xl">
                <!-- Window Controls Header -->
                <div class="flex items-center justify-between border-b border-white/10 pb-4">
                  <div class="flex items-center gap-2">
                    <span class="h-3 w-3 rounded-full bg-red-500/80" />
                    <span class="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span class="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span class="text-xs font-mono font-medium text-slate-400">lms.learning.workspace</span>
                </div>

                <!-- Learning Workspace Preview -->
                <div class="mt-5 space-y-3">
                  <!-- Active Lesson Preview -->
                  <div class="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-purple-300">
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                        </span>
                        <div>
                          <p class="text-sm font-bold text-white">React Native cho người mới</p>
                          <p class="text-xs text-slate-400">Bài 1: React Native và Expo là gì?</p>
                        </div>
                      </div>
                      <span class="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">Đang học</span>
                    </div>
                  </div>
                </div>

                <!-- Floating Interactive Widget: AI Assistant -->
                <div class="float-card float-card-ai mt-4 rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-950/90 to-slate-900/90 p-4 shadow-xl backdrop-blur-xl">
                  <div class="flex items-start gap-3">
                    <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div class="flex-1 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-purple-200">Trợ lý ảo AI Gemini 3.5 Flash</span>
                        <span class="text-[10px] text-emerald-400 font-medium">● Đang trực tuyến</span>
                      </div>
                      <p class="mt-1 text-slate-300 leading-relaxed">
                        "Chào bạn! Mình là Trợ lý ảo AI, luôn sẵn sàng đồng hành và hỗ trợ giải đáp thắc mắc trong suốt quá trình học tập."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Floating Micro-badge: Live Certificate -->
              <div class="float-badge-cert absolute -bottom-5 -left-6 hidden rounded-xl border border-emerald-500/30 bg-slate-900/95 p-3.5 shadow-xl shadow-black/40 backdrop-blur-xl sm:flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" /></svg>
                </span>
                <div>
                  <p class="text-xs font-bold text-white">Chứng chỉ cấp tự động</p>
                  <p class="text-[10px] text-emerald-400">Mã tra cứu công khai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- LIVE DYNAMIC STATS BANNER -->
    <section class="relative z-10 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 lg:grid-cols-4 sm:p-8">
        <div
          v-for="st in dynamicStats"
          :key="st.label"
          class="group flex flex-col items-center text-center p-3 rounded-xl transition hover:bg-purple-50/50 dark:hover:bg-slate-800/60"
        >
          <div class="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-purple-100 text-purple-700 transition group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-950/60 dark:text-purple-300">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="st.icon" /></svg>
          </div>
          <p class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">{{ st.value }}</p>
          <p class="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{{ st.label }}</p>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ st.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CATEGORY FILTER & FEATURED COURSES -->
    <section class="py-20 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              <span class="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
              <span>Khám phá tri thức</span>
            </div>
            <h2 class="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Khóa học nổi bật
            </h2>
            <p class="mt-2 text-base text-slate-500 dark:text-slate-400">
              Lựa chọn các khóa học lập trình chất lượng cao được thiết kế bài bản
            </p>
          </div>

          <!-- Carousel Controls -->
          <div class="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              class="carousel-nav-btn"
              aria-label="Xem khóa học trước"
              @click="scrollFeatured('previous')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              class="carousel-nav-btn"
              aria-label="Xem khóa học tiếp theo"
              @click="scrollFeatured('next')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6" /></svg>
            </button>
            <RouterLink
              to="/courses"
              class="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-purple-950/30"
            >
              <span>Xem tất cả</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </RouterLink>
          </div>
        </div>

        <!-- Interactive Category Quick Filter Tabs -->
        <div class="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            @click="selectedCategory = 'all'"
            :class="[
              'rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap',
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            ]"
          >
            Tất cả chủ đề ({{ totalCourses }})
          </button>
          <button
            v-for="cat in categoryStore.categories"
            :key="cat.id"
            type="button"
            @click="selectedCategory = cat.id"
            :class="[
              'rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap',
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            ]"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Course Cards Slider/Grid -->
        <div v-if="courseStore.loading && !isLoaded" class="py-12">
          <LoadingSpinner />
        </div>
        <div v-else-if="filteredCourses.length === 0" class="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <h3 class="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy khóa học phù hợp</h3>
          <p class="mt-1 text-sm text-slate-500">Hãy thử chọn chủ đề khác hoặc khám phá toàn bộ danh mục.</p>
        </div>
        <div
          v-else
          ref="featuredTrack"
          class="featured-track"
          aria-label="Danh sách khóa học nổi bật"
        >
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="featured-slide"
          >
            <CourseCard :course="course" />
          </div>
        </div>

        <div class="mt-8 text-center sm:hidden">
          <RouterLink
            to="/courses"
            class="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20"
          >
            Xem tất cả khóa học ➔
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- CORE FEATURES BENTO GRID -->
    <section class="border-t border-slate-200 bg-slate-50/50 py-20 dark:border-slate-800 dark:bg-slate-950/40 sm:py-28">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center mb-16">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            <span class="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
            <span>Trải nghiệm học tập hiện đại</span>
          </div>
          <h2 class="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Mọi tính năng bạn cần để làm chủ lập trình
          </h2>
          <p class="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Nền tảng được tối ưu hóa toàn diện từ bài giảng video, trắc nghiệm tương tác cho đến chấm điểm tự động.
          </p>
        </div>

        <!-- Bento Grid Layout -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feat in features"
            :key="feat.title"
            :class="[
              'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90',
              feat.colSpan,
              feat.borderGlow
            ]"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider" :class="feat.badgeClass">
                {{ feat.tag }}
              </span>
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="feat.icon" /></svg>
              </div>
            </div>

            <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">{{ feat.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{{ feat.desc }}</p>

            <!-- Decorative Subtle Accent Line -->
            <div class="mt-6 h-1 w-12 rounded-full bg-slate-200 transition-all duration-300 group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-pink-500 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </section>

    <!-- 3-STEP JOURNEY SECTION -->
    <section class="py-20 sm:py-28">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center mb-16">
          <span class="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Lộ trình tinh gọn</span>
          <h2 class="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Bắt đầu hành trình chỉ với 3 bước
          </h2>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          <div
            v-for="(st, idx) in learningSteps"
            :key="st.step"
            class="relative rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs transition hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-lg font-black text-white shadow-lg shadow-purple-600/30">
              {{ st.step }}
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ st.title }}</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ st.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CALL TO ACTION (CTA) BANNER -->
    <section class="relative overflow-hidden py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 px-6 py-16 text-center text-white shadow-2xl shadow-purple-900/40 sm:px-16 sm:py-20">
          <!-- Ambient Glow in CTA -->
          <div class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl" />
          <div class="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl" />

          <div class="relative z-10 mx-auto max-w-3xl">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Sẵn sàng làm chủ công nghệ và nâng tầm sự nghiệp?
            </h2>
            <p class="mx-auto mt-5 max-w-xl text-base sm:text-lg text-purple-100 leading-relaxed">
              Gia nhập ngay hôm nay để khám phá hệ thống bài giảng thực chiến, trợ lý AI và nhận chứng chỉ hoàn thành khóa học.
            </p>

            <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
              <RouterLink
                to="/courses"
                class="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-950 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-purple-50 active:scale-95"
              >
                <span>Bắt đầu học ngay</span>
                <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </RouterLink>

              <RouterLink
                v-if="!auth.isLoggedIn"
                to="/register"
                class="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20"
              >
                <span>Đăng ký miễn phí</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </DefaultLayout>
</template>

<style scoped>
/* AMBIENT AURORA ORBS ANIMATION */
@keyframes float-orb-1 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(30px, -40px) scale(1.1); }
}

@keyframes float-orb-2 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(-40px, 30px) scale(0.95); }
}

@keyframes float-orb-3 {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(25px, 35px) scale(1.05); }
}

.orb-1 { animation: float-orb-1 14s ease-in-out infinite; }
.orb-2 { animation: float-orb-2 18s ease-in-out infinite; }
.orb-3 { animation: float-orb-3 16s ease-in-out infinite; }

/* FLOATING MOCKUP CARDS */
@keyframes float-subtle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes float-badge {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
}

.float-card-ai {
  animation: float-subtle 6s ease-in-out infinite;
}

.float-badge-cert {
  animation: float-badge 5s ease-in-out infinite;
  animation-delay: 1s;
}

/* SHIMMER BUTTON GLOW */
@keyframes shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.shimmer-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: translateX(-100%);
}

.shimmer-btn:hover::after {
  animation: shimmer-sweep 1.2s ease-in-out infinite;
}

/* CAROUSEL TRACK & SLIDES */
.featured-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding: 0.5rem 0.25rem 1.5rem;
  overscroll-behavior-inline: contain;
}

.featured-track::-webkit-scrollbar {
  display: none;
}

.featured-slide {
  min-width: min(84vw, 20.5rem);
  scroll-snap-align: start;
}

@media (min-width: 640px) {
  .featured-slide {
    min-width: calc((100% - 1.5rem) / 2);
  }
}

@media (min-width: 1024px) {
  .featured-slide {
    min-width: calc((100% - 3rem) / 3);
  }
}

@media (min-width: 1280px) {
  .featured-slide {
    min-width: calc((100% - 4.5rem) / 4);
  }
}

.carousel-nav-btn {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #ffffff;
  color: #475569;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  transition: all 180ms ease;
}

.carousel-nav-btn:hover {
  border-color: #7c3aed;
  background: #7c3aed;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(124, 58, 237, 0.3);
}

:global(.dark) .carousel-nav-btn {
  border-color: #334155;
  background: #0f172a;
  color: #94a3b8;
}

:global(.dark) .carousel-nav-btn:hover {
  border-color: #7c3aed;
  background: #7c3aed;
  color: #ffffff;
}
</style>
