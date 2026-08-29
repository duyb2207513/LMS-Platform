<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Layers,
  Megaphone,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { useCourseStore } from '@/stores/courses'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import { CourseLevel } from '@/types'
import type { ApiResponse, Enrollment, Order, Review } from '@/types'

const route = useRoute()
const router = useRouter()
const courses = useCourseStore()
const auth = useAuthStore()
const api = useApi()

const reviews = ref<Review[]>([])
const enrollments = ref<Enrollment[]>([])
const summary = ref({ averageRating: 0, totalReviews: 0 })
const rating = ref(5)
const reviewContent = ref('')
const actionError = ref('')
const feedback = ref('')
const working = ref(false)
const copied = ref(false)

const course = computed(() => courses.currentCourse)
const enrollment = computed(() => enrollments.value.find((item) => item.courseId === course.value?.id))
const ownReview = computed(() => reviews.value.find((review) => review.user.id === auth.user?.id))

const levelLabels: Record<CourseLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
}

const levelColors: Record<CourseLevel, string> = {
  BEGINNER: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  INTERMEDIATE: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  ADVANCED: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
}

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const actionLabel = computed(() => {
  if (enrollment.value) return enrollment.value.progressPercent > 0 ? 'Tiếp tục học' : 'Bắt đầu học ngay'
  if (!auth.isLoggedIn) return course.value?.isFree ? 'Đăng nhập để học miễn phí' : 'Đăng nhập để mua khóa học'
  return course.value?.isFree ? 'Đăng ký học miễn phí' : 'Mua khóa học ngay'
})

const parsedOutcomes = computed(() => {
  if (!course.value?.learningOutcomes) return []
  return course.value.learningOutcomes
    .split('\n')
    .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)
})

const parsedRequirements = computed(() => {
  if (!course.value?.requirements) return []
  return course.value.requirements
    .split('\n')
    .map((s) => s.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)
})

const heroLeadDescription = computed(() => {
  if (!course.value?.description) return ''
  const desc = course.value.description.trim()
  const firstBlock = desc.split(/\n\s*[-*•]/)[0]?.split('\n\n')[0]?.trim() || desc
  return firstBlock
})

async function loadReviews() {
  if (!course.value) return
  try {
    const response = await api.get<ApiResponse<{ items: Review[]; summary: { averageRating: number; totalReviews: number } }>>(
      `/courses/${course.value.id}/reviews`
    )
    reviews.value = response.data?.items || []
    summary.value = response.data?.summary || summary.value
    if (ownReview.value) {
      rating.value = ownReview.value.rating
      reviewContent.value = ownReview.value.content || ''
    }
  } catch {
    // fallback gracefully
  }
}

async function loadEnrollments() {
  if (!auth.isStudent) return
  try {
    const response = await api.get<ApiResponse<Enrollment[]>>('/enrollments/me')
    enrollments.value = response.data || []
  } catch {
    // fallback gracefully
  }
}

async function primaryAction() {
  if (!auth.isLoggedIn) return router.push({ path: '/login', query: { redirect: route.fullPath } })
  if (!auth.isStudent) {
    actionError.value = 'Chỉ tài khoản học viên có thể đăng ký khóa học.'
    return
  }
  if (!course.value) return
  if (enrollment.value) return router.push(`/learn/${course.value.id}`)

  working.value = true
  actionError.value = ''
  try {
    if (course.value.isFree) {
      const response = await api.post<ApiResponse<Enrollment>>(`/courses/${course.value.id}/enroll`)
      if (response.data) {
        enrollments.value = [
          response.data,
          ...enrollments.value.filter((item) => item.courseId !== response.data?.courseId),
        ]
      }
      feedback.value = 'Đăng ký khóa học miễn phí thành công!'
      await router.push({ path: `/learn/${course.value.id}`, query: { enrolled: '1' } })
    } else {
      const response = await api.post<ApiResponse<Order>>('/orders', { courseIds: [course.value.id] })
      if (response.data) await router.push(`/checkout/${response.data.id}`)
    }
  } catch (cause) {
    if (course.value?.isFree) {
      try {
        await loadEnrollments()
        if (enrollment.value) {
          await router.push({ path: `/learn/${course.value.id}`, query: { enrolled: '1' } })
          return
        }
      } catch {
        // ignore
      }
    }
    actionError.value = cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.'
  } finally {
    working.value = false
  }
}

async function saveReview() {
  if (!course.value) return
  actionError.value = ''
  try {
    const payload = { rating: rating.value, content: reviewContent.value.trim() || null }
    if (ownReview.value) await api.patch(`/reviews/${ownReview.value.id}`, payload)
    else await api.post(`/courses/${course.value.id}/reviews`, payload)
    await loadReviews()
    feedback.value = ownReview.value ? 'Đã cập nhật đánh giá của bạn.' : 'Đã gửi đánh giá thành công!'
    setTimeout(() => { feedback.value = '' }, 3500)
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không gửi được đánh giá.'
  }
}

async function deleteReview() {
  if (!ownReview.value) return
  try {
    await api.del(`/reviews/${ownReview.value.id}`)
    reviewContent.value = ''
    rating.value = 5
    feedback.value = 'Đã xóa đánh giá.'
    await loadReviews()
    setTimeout(() => { feedback.value = '' }, 3500)
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không thể xóa đánh giá.'
  }
}

function shareCourse() {
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2500)
}

function formatDate(val?: string | Date) {
  if (!val) return 'Mới cập nhật'
  const d = new Date(val)
  if (isNaN(d.getTime())) return 'Mới cập nhật'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

onMounted(async () => {
  await courses.fetchCourseBySlug(String(route.params.slug))
  await Promise.all([loadReviews(), loadEnrollments()])
})
</script>

<template>
  <DefaultLayout>
    <div v-if="courses.loading" class="grid min-h-[60vh] place-items-center text-sm text-slate-500">
      <div class="flex flex-col items-center gap-3">
        <span class="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
        <p class="font-bold text-slate-600 dark:text-slate-400">Đang tải thông tin khóa học...</p>
      </div>
    </div>

    <main v-else-if="course" class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <!-- HERO BANNER SECTION -->
      <section class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/90 to-indigo-950 text-white py-10 lg:py-14 border-b border-purple-900/40">
        <!-- Ambient Glow -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div class="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
          <div class="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-indigo-600/15 blur-[100px]" />
          <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        </div>

        <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <!-- Back button & Breadcrumbs -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-2 text-xs sm:text-sm text-purple-200">
              <RouterLink to="/courses" class="inline-flex items-center gap-1 font-bold text-purple-300 hover:text-white transition">
                <ArrowLeft :size="16" /> Khám phá khóa học
              </RouterLink>
              <span class="text-purple-400/60">/</span>
              <span class="text-purple-300/80 truncate max-w-[200px] sm:max-w-xs">{{ course.category?.name || 'Khóa học' }}</span>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              @click="shareCourse"
            >
              <Check v-if="copied" :size="14" class="text-emerald-400" />
              <Share2 v-else :size="14" />
              <span>{{ copied ? 'Đã sao chép link' : 'Chia sẻ' }}</span>
            </button>
          </div>

          <!-- Hero Main Content Grid -->
          <div class="grid gap-10 lg:grid-cols-12 items-start">
            <!-- Left Info Column -->
            <div class="lg:col-span-7 xl:col-span-8 space-y-5">
              <!-- Chips -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-md border border-purple-400/40 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-200 backdrop-blur-md">
                  {{ course.category?.name || 'Công nghệ' }}
                </span>
                <span :class="['rounded-md border px-3 py-1 text-xs font-bold backdrop-blur-md', levelColors[course.level]]">
                  {{ levelLabels[course.level] }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                  <Globe :size="13" /> {{ course.language }}
                </span>
              </div>

              <!-- Title -->
              <h1 class="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                {{ course.title }}
              </h1>

              <!-- Subtitle / Short Description Lead -->
              <p class="text-base sm:text-lg text-purple-100 font-normal leading-relaxed max-w-3xl line-clamp-3 sm:line-clamp-4">
                {{ heroLeadDescription }}
              </p>

              <!-- Rating & Meta stats -->
              <div class="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-purple-200">
                <!-- Rating Score -->
                <div class="flex items-center gap-2">
                  <span class="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950">
                    {{ summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '5.0' }}
                  </span>
                  <StarRating :model-value="summary.averageRating > 0 ? Math.round(summary.averageRating) : 5" readonly size="sm" />
                  <span class="text-purple-300 font-semibold">({{ summary.totalReviews }} đánh giá)</span>
                </div>

                <span class="hidden sm:inline text-purple-400/40">•</span>

                <!-- Instructor -->
                <div class="flex items-center gap-2">
                  <div class="grid h-7 w-7 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-xs">
                    {{ course.instructor?.fullName?.charAt(0) || 'G' }}
                  </div>
                  <span>Giảng viên: <strong class="text-white">{{ course.instructor?.fullName || 'LMS Instructor' }}</strong></span>
                </div>

                <span class="hidden sm:inline text-purple-400/40">•</span>

                <!-- Updated date -->
                <div class="flex items-center gap-1.5 text-purple-300">
                  <Calendar :size="14" />
                  <span>Cập nhật {{ formatDate(course.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Interactive Sticky Purchase / Action Card -->
            <div class="lg:col-span-5 xl:col-span-4">
              <div class="sticky top-24 rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-purple-900/50 dark:bg-slate-900/95 text-slate-950 dark:text-white transition-all">
                <!-- Thumbnail -->
                <div class="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                  <CourseThumbnail :src="course.thumbnailUrl" :alt="course.title" class="aspect-video w-full object-cover transition-transform duration-500 hover:scale-105" />
                  <span
                    v-if="course.isFree"
                    class="absolute top-3 right-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white shadow-lg uppercase tracking-wider"
                  >
                    Miễn phí
                  </span>
                  <span
                    v-else
                    class="absolute top-3 right-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white shadow-lg uppercase tracking-wider"
                  >
                    Bán chạy
                  </span>
                </div>

                <!-- Price & Enrollment status -->
                <div class="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Học phí</p>
                    <p class="text-3xl font-black text-purple-700 dark:text-purple-400 mt-0.5">
                      {{ course.isFree ? 'Miễn phí 100%' : money(course.price) }}
                    </p>
                  </div>
                  <span
                    v-if="enrollment"
                    class="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <CheckCircle2 :size="14" /> Đã đăng ký
                  </span>
                </div>

                <!-- Primary CTA Button -->
                <button
                  type="button"
                  :disabled="working"
                  class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-600/30 transition hover:from-violet-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-60"
                  @click="primaryAction"
                >
                  <span v-if="working" class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <template v-else>
                    <span>{{ actionLabel }}</span>
                    <ArrowRight :size="18" />
                  </template>
                </button>

                <!-- Feedback / Error messages -->
                <p v-if="feedback" class="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-center">
                  {{ feedback }}
                </p>
                <p v-if="actionError" class="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-center">
                  {{ actionError }}
                </p>

                <!-- If enrolled: Quick Direct Links -->
                <div v-if="enrollment" class="mt-4 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <RouterLink
                    :to="`/learn/${course.id}`"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    <BookOpen :size="15" /> Vào phòng học bài giảng ngay
                  </RouterLink>
                  <RouterLink
                    :to="`/instructor/courses/${course.id}/announcements`"
                    class="inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300"
                  >
                    <Megaphone :size="14" /> Xem thông báo từ giảng viên
                  </RouterLink>
                </div>

                <!-- Course Guarantee / Features Checklist -->
                <div class="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <p class="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Khóa học này bao gồm:</p>
                  <div class="flex items-center gap-2.5">
                    <Award :size="16" class="text-purple-600 shrink-0" />
                    <span>Chứng chỉ hoàn thành có mã xác thực</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <Clock :size="16" class="text-purple-600 shrink-0" />
                    <span>Quyền truy cập học tập trọn đời</span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <GraduationCap :size="16" class="text-purple-600 shrink-0" />
                    <span>Bài tập thực hành và Quiz chấm điểm tự động</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BODY CONTENT SECTION -->
      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid gap-10 lg:grid-cols-12 items-start">
          <!-- Left Main Column (Detailed info & Reviews) -->
          <div class="lg:col-span-7 xl:col-span-8 space-y-8">
            <!-- 1. What You Will Learn (Mục tiêu học tập) -->
            <article class="rounded-3xl border border-purple-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                  <Sparkles :size="20" />
                </span>
                <div>
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Bạn sẽ học được gì?</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Kiến thức và kỹ năng thực chiến tích lũy sau khóa học</p>
                </div>
              </div>

              <div v-if="parsedOutcomes.length" class="mt-6 grid gap-3 sm:grid-cols-2">
                <div
                  v-for="(outcome, idx) in parsedOutcomes"
                  :key="idx"
                  class="flex items-start gap-3 rounded-2xl bg-purple-50/50 p-3.5 border border-purple-100 dark:bg-slate-800/60 dark:border-slate-800"
                >
                  <CheckCircle2 :size="18" class="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                  <span class="text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">{{ outcome }}</span>
                </div>
              </div>
              <p v-else class="mt-4 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {{ course.learningOutcomes || 'Nội dung mục tiêu học tập đang được giảng viên cập nhật chi tiết.' }}
              </p>
            </article>

            <!-- 2. Course Description (Giới thiệu chi tiết) -->
            <article class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                  <BookOpen :size="20" />
                </span>
                <div>
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Giới thiệu khóa học</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Thông tin tổng quan và nội dung giảng dạy</p>
                </div>
              </div>

              <div class="mt-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-4 font-normal">
                {{ course.description }}
              </div>
            </article>

            <!-- 3. Requirements (Yêu cầu đầu vào) -->
            <article class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  <Layers :size="20" />
                </span>
                <div>
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Yêu cầu &amp; Điều kiện tiên quyết</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Những kiến thức chuẩn bị trước khi tham gia</p>
                </div>
              </div>

              <div v-if="parsedRequirements.length" class="mt-6 space-y-2.5">
                <div
                  v-for="(req, idx) in parsedRequirements"
                  :key="idx"
                  class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span class="h-2 w-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span class="leading-relaxed">{{ req }}</span>
                </div>
              </div>
              <p v-else class="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {{ course.requirements || 'Không yêu cầu kinh nghiệm trước đó. Phù hợp cho mọi người học mới bắt đầu.' }}
              </p>
            </article>

            <!-- 4. Instructor Card (Giảng viên) -->
            <article class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex items-center gap-3 mb-6">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
                  <User :size="20" />
                </span>
                <div>
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Giảng viên hướng dẫn</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Đội ngũ chuyên gia giàu kinh nghiệm thực chiến</p>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl bg-purple-50/50 p-5 border border-purple-100 dark:bg-slate-800/50 dark:border-slate-800">
                <div class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-2xl font-black text-white shadow-md">
                  {{ course.instructor?.fullName?.charAt(0) || 'G' }}
                </div>
                <div class="space-y-1">
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ course.instructor?.fullName }}</h3>
                  <p class="text-xs font-semibold text-purple-700 dark:text-purple-400">Giảng viên chuyên môn • LMS Platform Creator</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    Chuyên gia đào tạo hàng đầu với nhiều năm kinh nghiệm nghiên cứu &amp; phát triển các hệ thống AI, phần mềm quy mô lớn.
                  </p>
                </div>
              </div>
            </article>

            <!-- 5. Course Reviews (Đánh giá & Nhận xét) -->
            <article class="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Đánh giá từ học viên</h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Phản hồi và trải nghiệm thực tế sau khi học</p>
                </div>

                <div class="flex items-center gap-3 rounded-2xl bg-purple-50 px-4 py-2 dark:bg-purple-950/40">
                  <span class="text-3xl font-black text-purple-700 dark:text-purple-300">
                    {{ summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '5.0' }}
                  </span>
                  <div>
                    <StarRating :model-value="summary.averageRating > 0 ? Math.round(summary.averageRating) : 5" readonly size="sm" />
                    <p class="text-[11px] font-bold text-slate-500">{{ summary.totalReviews }} lượt đánh giá</p>
                  </div>
                </div>
              </div>

              <!-- Student Review Form (for enrolled students) -->
              <form
                v-if="auth.isStudent && enrollment"
                class="mt-6 rounded-2xl bg-slate-50 p-5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700"
                @submit.prevent="saveReview"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Gửi nhận xét của bạn</h3>
                    <p class="text-xs text-slate-500">Đánh giá khóa học để giúp giảng viên hoàn thiện bài giảng tốt hơn</p>
                  </div>
                  <StarRating v-model="rating" size="lg" />
                </div>

                <textarea
                  v-model="reviewContent"
                  rows="3"
                  class="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Chia sẻ cảm nhận, điểm bạn thích hoặc góp ý cho khóa học..."
                />

                <div class="mt-3 flex flex-wrap items-center gap-3">
                  <BaseButton type="submit" size="sm">
                    {{ ownReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá' }}
                  </BaseButton>
                  <BaseButton v-if="ownReview" type="button" variant="ghost" size="sm" @click="deleteReview">
                    Xóa đánh giá
                  </BaseButton>
                </div>
              </form>

              <!-- Reviews List -->
              <div v-if="reviews.length" class="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                <div v-for="rev in reviews" :key="rev.id" class="py-5 first:pt-0 last:pb-0 space-y-2">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="grid h-9 w-9 place-items-center rounded-xl bg-purple-100 font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs">
                        {{ rev.user?.fullName?.charAt(0) || 'H' }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ rev.user?.fullName }}</p>
                        <p class="text-[11px] text-slate-400">{{ formatDate(rev.createdAt) }}</p>
                      </div>
                    </div>
                    <StarRating :model-value="rev.rating" readonly size="sm" />
                  </div>
                  <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {{ rev.content || 'Học viên không để lại bình luận chi tiết.' }}
                  </p>
                </div>
              </div>
              <div v-else class="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-800/40">
                <MessageSquare :size="28" class="mx-auto text-slate-400 mb-2" />
                <p class="font-bold">Chưa có đánh giá nào cho khóa học này</p>
                <p class="text-xs text-slate-400 mt-1">Hãy đăng ký và trở thành người đầu tiên chia sẻ cảm nhận!</p>
              </div>
            </article>
          </div>

          <!-- Right Sidebar Meta Stats Card -->
          <aside class="lg:col-span-5 xl:col-span-4 space-y-6">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 class="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Tổng quan khóa học
              </h3>
              <dl class="mt-4 space-y-3.5 text-xs sm:text-sm">
                <div class="flex items-center justify-between">
                  <dt class="text-slate-500 flex items-center gap-1.5"><Layers :size="15" /> Cấp độ</dt>
                  <dd class="font-bold text-slate-900 dark:text-white">{{ levelLabels[course.level] }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-slate-500 flex items-center gap-1.5"><Globe :size="15" /> Ngôn ngữ</dt>
                  <dd class="font-bold text-slate-900 dark:text-white">{{ course.language }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-slate-500 flex items-center gap-1.5"><Award :size="15" /> Chứng chỉ</dt>
                  <dd class="font-bold text-purple-600 dark:text-purple-400">Có (Số hóa)</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-slate-500 flex items-center gap-1.5"><Clock :size="15" /> Thời hạn</dt>
                  <dd class="font-bold text-slate-900 dark:text-white">Trọn đời</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-slate-500 flex items-center gap-1.5"><Calendar :size="15" /> Ngày đăng</dt>
                  <dd class="font-bold text-slate-900 dark:text-white">{{ formatDate(course.publishedAt || course.createdAt) }}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </main>
  </DefaultLayout>
</template>

<style scoped>
/* Scoped styles kept minimal for Tailwind */
</style>
