<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCourseStore } from '@/stores/courses'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
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
const working = ref(false)

const course = computed(() => courses.currentCourse)
const enrollment = computed(() => enrollments.value.find(item => item.courseId === course.value?.id))
const ownReview = computed(() => reviews.value.find(review => review.user.id === auth.user?.id))
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
  if (!auth.isLoggedIn) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!auth.isStudent) {
    actionError.value = 'Chỉ tài khoản học viên có thể đăng ký khóa học.'
    return
  }
  if (!course.value) return
  if (enrollment.value) {
    await router.push(`/learn/${course.value.id}`)
    return
  }

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
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Không thể thực hiện thao tác.'
  } finally {
    working.value = false
  }
}

async function saveReview() {
  if (!course.value) return
  try {
    const payload = { rating: rating.value, content: reviewContent.value.trim() || null }
    if (ownReview.value) await api.patch(`/reviews/${ownReview.value.id}`, payload)
    else await api.post(`/courses/${course.value.id}/reviews`, payload)
    await loadReviews()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Không gửi được đánh giá.'
  }
}

async function deleteReview() {
  if (!ownReview.value || !confirm('Xóa đánh giá của bạn?')) return
  await api.del(`/reviews/${ownReview.value.id}`)
  reviewContent.value = ''
  rating.value = 5
  await loadReviews()
}

onMounted(async () => {
  await courses.fetchCourseBySlug(String(route.params.slug))
  await Promise.all([loadReviews(), loadEnrollments()])
})
</script>

<template>
  <DefaultLayout>
    <div v-if="courses.loading" class="py-24 text-center text-slate-500">Đang tải khóa học...</div>
    <main v-else-if="course">
      <section class="bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 text-white">
        <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_360px]">
          <div>
            <RouterLink to="/courses" class="text-purple-100">← Tất cả khóa học</RouterLink>
            <p class="mt-7 text-sm font-bold uppercase tracking-widest text-amber-300">{{ course.category?.name }}</p>
            <h1 class="mt-3 text-4xl font-black md:text-5xl">{{ course.title }}</h1>
            <p class="mt-5 max-w-3xl text-lg text-purple-50">{{ course.description }}</p>
            <p class="mt-5">Giảng viên: <b>{{ course.instructor?.fullName }}</b> · {{ course.language }}</p>
          </div>
          <aside class="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <img v-if="course.thumbnailUrl" :src="course.thumbnailUrl" class="mb-5 aspect-video w-full rounded-2xl object-cover">
            <div v-else class="mb-5 grid aspect-video place-items-center rounded-2xl bg-purple-50 text-5xl">📚</div>
            <p v-if="enrollment" class="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Đã đăng ký</p>
            <p class="text-3xl font-black text-purple-600">{{ course.isFree ? 'Miễn phí' : money(course.price) }}</p>
            <BaseButton class="mt-5 w-full" :loading="working" @click="primaryAction">{{ actionLabel }}</BaseButton>
            <RouterLink v-if="enrollment" to="/my-courses" class="mt-3 block text-center text-sm font-semibold text-purple-600">Xem tất cả khóa học của tôi</RouterLink>
            <p v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ actionError }}</p>
          </aside>
        </div>
      </section>

      <section class="mx-auto grid max-w-6xl gap-9 px-4 py-12 md:grid-cols-[1fr_360px]">
        <div class="space-y-9">
          <div><h2 class="text-2xl font-extrabold">Giới thiệu</h2><p class="mt-3 whitespace-pre-line text-slate-600 dark:text-slate-300">{{ course.description }}</p></div>
          <div><h2 class="text-2xl font-extrabold">Bạn sẽ học được gì?</h2><p class="mt-3 whitespace-pre-line text-slate-600 dark:text-slate-300">{{ course.learningOutcomes || 'Nội dung sẽ được giảng viên cập nhật.' }}</p></div>
          <div><h2 class="text-2xl font-extrabold">Yêu cầu</h2><p class="mt-3 whitespace-pre-line text-slate-600 dark:text-slate-300">{{ course.requirements || 'Không có yêu cầu đặc biệt.' }}</p></div>
        </div>
        <div class="h-fit rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 class="font-bold">Thông tin khóa học</h3>
          <dl class="mt-4 space-y-3 text-sm"><div class="flex justify-between"><dt>Cấp độ</dt><dd>{{ course.level }}</dd></div><div class="flex justify-between"><dt>Ngôn ngữ</dt><dd>{{ course.language }}</dd></div><div class="flex justify-between"><dt>Trạng thái</dt><dd>{{ course.status }}</dd></div></dl>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-4 pb-14">
        <h2 class="text-2xl font-extrabold">Đánh giá khóa học</h2>
        <p class="mt-2 text-xl font-bold text-amber-500">{{ summary.averageRating }} ★ · {{ summary.totalReviews }} đánh giá</p>
        <form v-if="auth.isStudent && enrollment" class="my-6 rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900" @submit.prevent="saveReview">
          <label class="font-bold">Đánh giá của bạn</label>
          <select v-model.number="rating" class="ml-3 rounded-lg border p-2 dark:bg-slate-800"><option v-for="value in 5" :key="value" :value="value">{{ value }} sao</option></select>
          <textarea v-model="reviewContent" class="mt-4 w-full rounded-xl border p-3 dark:bg-slate-800" rows="3" placeholder="Chia sẻ trải nghiệm học tập..."></textarea>
          <div class="mt-3 flex gap-3"><BaseButton type="submit">{{ ownReview ? 'Cập nhật' : 'Gửi đánh giá' }}</BaseButton><button v-if="ownReview" type="button" class="text-red-600" @click="deleteReview">Xóa</button></div>
        </form>
        <p v-else-if="auth.isStudent" class="my-5 rounded-xl bg-amber-50 p-4 text-amber-700">Bạn cần đăng ký khóa học trước khi đánh giá.</p>
        <div class="grid gap-4 md:grid-cols-2"><article v-for="review in reviews" :key="review.id" class="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div class="flex justify-between"><b>{{ review.user.fullName }}</b><span class="text-amber-500">{{ '★'.repeat(review.rating) }}</span></div><p class="mt-3 text-slate-600 dark:text-slate-300">{{ review.content || 'Không có nhận xét.' }}</p></article></div>
      </section>
    </main>
  </DefaultLayout>
</template>
