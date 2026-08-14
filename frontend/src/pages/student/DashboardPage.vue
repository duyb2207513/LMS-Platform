<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Enrollment } from '@/types'

const auth = useAuthStore()
const api = useApi()
const enrollments = ref<Enrollment[]>([])
const error = ref('')
const completed = computed(() => enrollments.value.filter(item => item.status === 'COMPLETED').length)
const average = computed(() => enrollments.value.length ? Math.round(enrollments.value.reduce((total, item) => total + item.progressPercent, 0) / enrollments.value.length) : 0)
const recent = computed(() => enrollments.value.slice(0, 4))

async function load() {
  try {
    const response = await api.get<ApiResponse<Enrollment[]>>('/enrollments/me')
    enrollments.value = response.data || []
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Không tải được dữ liệu học tập.'
  }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-7xl px-4 py-10">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div><h1 class="text-3xl font-extrabold">Xin chào, {{ auth.user?.fullName }}! 👋</h1><p class="mt-2 text-slate-500">Theo dõi tiến độ và tiếp tục khóa học của bạn.</p></div>
        <RouterLink to="/courses" class="rounded-xl bg-purple-600 px-5 py-3 font-bold text-white">Khám phá khóa học</RouterLink>
      </div>

      <LoadingSpinner v-if="api.loading.value && !enrollments.length" class="py-12" />
      <p v-if="error" class="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</p>

      <div class="my-8 grid gap-5 sm:grid-cols-3">
        <div class="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><p class="text-3xl font-black text-purple-600">{{ enrollments.length }}</p><p class="mt-1 text-slate-500">Khóa học đã đăng ký</p></div>
        <div class="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><p class="text-3xl font-black text-emerald-600">{{ completed }}</p><p class="mt-1 text-slate-500">Khóa học hoàn thành</p></div>
        <div class="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><p class="text-3xl font-black text-amber-500">{{ average }}%</p><p class="mt-1 text-slate-500">Tiến độ trung bình</p></div>
      </div>

      <section>
        <div class="mb-5 flex items-center justify-between"><h2 class="text-2xl font-extrabold">Tiếp tục học</h2><RouterLink to="/my-courses" class="font-bold text-purple-600">Xem tất cả →</RouterLink></div>
        <div v-if="recent.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in recent" :key="item.id" class="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <img v-if="item.course.thumbnailUrl" :src="item.course.thumbnailUrl" class="h-36 w-full object-cover">
            <div v-else class="grid h-36 place-items-center bg-purple-50 text-4xl">📚</div>
            <div class="p-4"><h3 class="line-clamp-2 min-h-12 font-bold">{{ item.course.title }}</h3><div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-purple-600" :style="{ width: `${item.progressPercent}%` }"></div></div><p class="mt-2 text-xs text-slate-500">{{ Math.round(item.progressPercent) }}% hoàn thành</p><RouterLink :to="`/learn/${item.courseId}`" class="mt-4 block rounded-xl bg-purple-600 px-4 py-2 text-center font-bold text-white">{{ item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học' }}</RouterLink></div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-dashed p-12 text-center"><p class="text-slate-500">Bạn chưa đăng ký khóa học nào.</p><RouterLink to="/courses" class="mt-4 inline-block font-bold text-purple-600">Chọn khóa học đầu tiên →</RouterLink></div>
      </section>

      <section class="mt-10 grid gap-4 md:grid-cols-3">
        <RouterLink to="/my-courses" class="rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 p-6 text-white"><p class="text-3xl">📖</p><h3 class="mt-4 text-xl font-bold">Khóa học của tôi</h3><p class="mt-1 text-purple-100">Xem toàn bộ nội dung đang học.</p></RouterLink>
        <RouterLink to="/orders" class="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white"><p class="text-3xl">🧾</p><h3 class="mt-4 text-xl font-bold">Đơn hàng</h3><p class="mt-1 text-blue-100">Checkout và lịch sử thanh toán.</p></RouterLink>
        <RouterLink to="/certificates" class="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white"><p class="text-3xl">🎓</p><h3 class="mt-4 text-xl font-bold">Chứng chỉ</h3><p class="mt-1 text-amber-100">Xem và xác minh chứng chỉ.</p></RouterLink>
      </section>
    </main>
  </DefaultLayout>
</template>
