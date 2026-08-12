<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const course = computed(() => courses.currentCourse)
const enrollment = computed(() => enrollments.value.find((item) => item.courseId === course.value?.id))
const ownReview = computed(() => reviews.value.find((review) => review.user.id === auth.user?.id))
const levelLabels: Record<CourseLevel, string> = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' }
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
const actionLabel = computed(() => {
  if (enrollment.value) return enrollment.value.progressPercent > 0 ? 'Tiếp tục học' : 'Bắt đầu học'
  if (!auth.isLoggedIn) return course.value?.isFree ? 'Đăng nhập để học miễn phí' : 'Đăng nhập để mua khóa học'
  return course.value?.isFree ? 'Đăng ký học miễn phí' : 'Mua khóa học'
})

async function loadReviews() {
  if (!course.value) return
  const response = await api.get<ApiResponse<{ items: Review[]; summary: { averageRating: number; totalReviews: number } }>>(`/courses/${course.value.id}/reviews`)
  reviews.value = response.data?.items || []
  summary.value = response.data?.summary || summary.value
  if (ownReview.value) {
    rating.value = ownReview.value.rating
    reviewContent.value = ownReview.value.content || ''
  }
}

async function loadEnrollments() {
  if (!auth.isStudent) return
  const response = await api.get<ApiResponse<Enrollment[]>>('/enrollments/me')
  enrollments.value = response.data || []
}

async function primaryAction() {
  if (!auth.isLoggedIn) return router.push({ path: '/login', query: { redirect: route.fullPath } })
  if (!auth.isStudent) { actionError.value = 'Chỉ tài khoản học viên có thể đăng ký khóa học.'; return }
  if (!course.value) return
  if (enrollment.value) return router.push(`/learn/${course.value.id}`)
  working.value = true
  actionError.value = ''
  try {
    if (course.value.isFree) {
      await api.post(`/courses/${course.value.id}/enroll`)
      await loadEnrollments()
      await router.push(`/learn/${course.value.id}`)
    } else {
      const response = await api.post<ApiResponse<Order>>('/orders', { courseIds: [course.value.id] })
      if (response.data) await router.push(`/checkout/${response.data.id}`)
    }
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác.'
  } finally { working.value = false }
}

async function saveReview() {
  if (!course.value) return
  actionError.value = ''
  try {
    const payload = { rating: rating.value, content: reviewContent.value.trim() || null }
    if (ownReview.value) await api.patch(`/reviews/${ownReview.value.id}`, payload)
    else await api.post(`/courses/${course.value.id}/reviews`, payload)
    await loadReviews()
    feedback.value = ownReview.value ? 'Đã cập nhật đánh giá của bạn.' : 'Đã gửi đánh giá.'
  } catch (cause) { actionError.value = cause instanceof Error ? cause.message : 'Không gửi được đánh giá.' }
}

async function deleteReview() {
  if (!ownReview.value) return
  await api.del(`/reviews/${ownReview.value.id}`)
  reviewContent.value = ''
  rating.value = 5
  feedback.value = 'Đã xóa đánh giá.'
  await loadReviews()
}

onMounted(async () => {
  await courses.fetchCourseBySlug(String(route.params.slug))
  await Promise.all([loadReviews(), loadEnrollments()])
})
</script>

<template>
  <DefaultLayout>
    <div v-if="courses.loading" class="grid min-h-[60vh] place-items-center text-sm text-slate-500">Đang tải khóa học...</div>
    <main v-else-if="course">
      <section class="course-hero text-white">
        <div class="app-page grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-16">
          <div class="self-center">
            <RouterLink to="/courses" class="inline-flex items-center gap-2 text-sm font-semibold text-purple-100 hover:text-white">← Quay lại danh sách</RouterLink>
            <div class="mt-8 flex flex-wrap gap-2"><span class="hero-chip">{{ course.category?.name || 'Khóa học' }}</span><span class="hero-chip">{{ levelLabels[course.level] }}</span><span class="hero-chip">{{ course.language }}</span></div>
            <h1 class="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{{ course.title }}</h1>
            <p class="mt-5 max-w-3xl text-base leading-7 text-purple-100 sm:text-lg">{{ course.description }}</p>
            <div class="mt-7 flex flex-wrap items-center gap-4 text-sm">
              <div class="flex items-center gap-2"><span class="grid h-9 w-9 place-items-center rounded-full bg-white/15 font-bold">{{ course.instructor?.fullName?.charAt(0) || 'L' }}</span><span>Giảng viên <b>{{ course.instructor?.fullName }}</b></span></div>
              <span class="hidden h-5 w-px bg-white/25 sm:block" /><div class="flex items-center gap-2"><StarRating :model-value="Math.round(summary.averageRating)" readonly size="sm" /><b>{{ summary.averageRating.toFixed(1) }}</b><span class="text-purple-200">({{ summary.totalReviews }} đánh giá)</span></div>
            </div>
          </div>

          <aside class="overflow-hidden rounded-3xl border border-white/30 bg-white p-3 text-slate-950 shadow-2xl shadow-purple-950/25 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <CourseThumbnail :src="course.thumbnailUrl" :alt="course.title" compact />
            <div class="p-3 sm:p-4">
              <div class="flex items-center justify-between gap-3"><p class="text-3xl font-black text-purple-700 dark:text-purple-300">{{ course.isFree ? 'Miễn phí' : money(course.price) }}</p><span v-if="enrollment" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Đã đăng ký</span></div>
              <BaseButton class="mt-5" :full-width="true" size="lg" :loading="working" @click="primaryAction">{{ actionLabel }} <span aria-hidden="true">→</span></BaseButton>
              <RouterLink v-if="enrollment" to="/my-courses" class="mt-4 block text-center text-sm font-semibold text-purple-700 dark:text-purple-300">Xem khóa học của tôi</RouterLink>
              <p v-if="actionError" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ actionError }}</p>
              <div class="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm dark:border-slate-800"><div><p class="text-slate-500">Hình thức</p><b>{{ course.isFree ? 'Miễn phí' : 'Thanh toán một lần' }}</b></div><div><p class="text-slate-500">Truy cập</p><b>Không giới hạn</b></div></div>
            </div>
          </aside>
        </div>
      </section>

      <section class="app-page grid gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div class="space-y-6">
          <article class="surface-card p-6 sm:p-8"><span class="section-icon">01</span><h2 class="mt-4 text-2xl font-extrabold">Giới thiệu khóa học</h2><p class="mt-4 whitespace-pre-line leading-8 text-slate-600 dark:text-slate-300">{{ course.description }}</p></article>
          <article class="surface-card p-6 sm:p-8"><span class="section-icon">02</span><h2 class="mt-4 text-2xl font-extrabold">Bạn sẽ học được gì?</h2><p class="mt-4 whitespace-pre-line leading-8 text-slate-600 dark:text-slate-300">{{ course.learningOutcomes || 'Nội dung học tập sẽ được giảng viên cập nhật.' }}</p></article>
          <article class="surface-card p-6 sm:p-8"><span class="section-icon">03</span><h2 class="mt-4 text-2xl font-extrabold">Yêu cầu đầu vào</h2><p class="mt-4 whitespace-pre-line leading-8 text-slate-600 dark:text-slate-300">{{ course.requirements || 'Không có yêu cầu đặc biệt.' }}</p></article>
        </div>
        <aside class="surface-card h-fit p-6 lg:sticky lg:top-24"><h3 class="text-lg font-extrabold">Thông tin khóa học</h3><dl class="mt-5 space-y-4 text-sm"><div class="info-row"><dt>Cấp độ</dt><dd>{{ levelLabels[course.level] }}</dd></div><div class="info-row"><dt>Ngôn ngữ</dt><dd>{{ course.language }}</dd></div><div class="info-row"><dt>Cập nhật</dt><dd>{{ new Date(course.updatedAt).toLocaleDateString('vi-VN') }}</dd></div><div class="info-row"><dt>Trạng thái</dt><dd>Đang mở</dd></div></dl></aside>
      </section>

      <section class="app-page px-4 pb-16 sm:px-6 lg:px-8">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p class="text-sm font-bold uppercase tracking-wider text-purple-600">Cộng đồng học viên</p><h2 class="mt-2 text-3xl font-black">Đánh giá khóa học</h2></div><div class="flex items-center gap-3"><span class="text-4xl font-black">{{ summary.averageRating.toFixed(1) }}</span><div><StarRating :model-value="Math.round(summary.averageRating)" readonly /><p class="text-xs text-slate-500">{{ summary.totalReviews }} lượt đánh giá</p></div></div></div>
        <form v-if="auth.isStudent && enrollment" class="surface-card mb-6 p-6" @submit.prevent="saveReview"><div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="font-extrabold">Trải nghiệm của bạn</h3><p class="mt-1 text-sm text-slate-500">Đánh giá giúp giảng viên cải thiện khóa học.</p></div><StarRating v-model="rating" size="lg" /></div><textarea v-model="reviewContent" rows="4" class="review-textarea" placeholder="Chia sẻ điều bạn thích hoặc góp ý cho khóa học..."></textarea><div class="mt-4 flex flex-wrap items-center gap-3"><BaseButton type="submit">{{ ownReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá' }}</BaseButton><BaseButton v-if="ownReview" type="button" variant="ghost" @click="deleteReview">Xóa đánh giá</BaseButton><span v-if="feedback" class="text-sm font-medium text-emerald-600">{{ feedback }}</span></div></form>
        <p v-else-if="auth.isStudent" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Bạn cần đăng ký khóa học trước khi gửi đánh giá.</p>
        <div v-if="reviews.length" class="grid gap-4 md:grid-cols-2"><article v-for="review in reviews" :key="review.id" class="surface-card p-5"><div class="flex items-center justify-between gap-3"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">{{ review.user.fullName.charAt(0) }}</span><div><b>{{ review.user.fullName }}</b><p class="text-xs text-slate-500">{{ new Date(review.createdAt).toLocaleDateString('vi-VN') }}</p></div></div><StarRating :model-value="review.rating" readonly size="sm" /></div><p class="mt-4 leading-7 text-slate-600 dark:text-slate-300">{{ review.content || 'Học viên chưa để lại nhận xét.' }}</p></article></div>
        <div v-else class="surface-card p-8 text-center text-sm text-slate-500">Chưa có đánh giá. Hãy là người đầu tiên chia sẻ trải nghiệm.</div>
      </section>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.course-hero { background: radial-gradient(circle at 78% 10%, rgba(236,72,153,.55), transparent 27%), linear-gradient(125deg, #312e81 0%, #6d28d9 52%, #9333ea 100%); }
.hero-chip { border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(255,255,255,.1); padding: .4rem .8rem; font-size: .75rem; font-weight: 700; backdrop-filter: blur(6px); }
.section-icon { display: grid; width: 2.75rem; height: 2.75rem; place-items: center; border-radius: .9rem; background: var(--brand-soft); color: var(--brand); font-size: .75rem; font-weight: 900; }
.info-row { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }.info-row:last-child{border:0;padding:0}.info-row dt{color:var(--text-muted)}.info-row dd{font-weight:700;text-align:right}
.review-textarea { margin-top: 1.25rem; width: 100%; resize: vertical; border: 1px solid var(--border); border-radius: 1rem; background: var(--surface-muted); padding: 1rem; color: var(--text); outline: none; }.review-textarea:focus{border-color:#a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.1)}
</style>
