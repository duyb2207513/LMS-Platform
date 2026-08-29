<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  PlayCircle,
  Receipt,
  Sparkles,
} from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Certificate, Enrollment } from '@/types'

type Filter = 'ALL' | 'LEARNING' | 'COMPLETED'
const api = useApi()
const items = ref<Enrollment[]>([])
const error = ref('')
const filter = ref<Filter>('ALL')
const issuingId = ref('')
const page = ref(1)
const PAGE_SIZE = 8

const completed = computed(() => items.value.filter((item) => item.status === 'COMPLETED').length)
const inProgress = computed(() => items.value.filter((item) => item.status !== 'COMPLETED').length)
const averageProgress = computed(() =>
  items.value.length
    ? Math.round(items.value.reduce((sum, item) => sum + item.progressPercent, 0) / items.value.length)
    : 0,
)
const visibleItems = computed(() =>
  items.value.filter(
    (item) =>
      filter.value === 'ALL' ||
      (filter.value === 'COMPLETED' ? item.status === 'COMPLETED' : item.status !== 'COMPLETED'),
  ),
)
const totalPages = computed(() => Math.max(1, Math.ceil(visibleItems.value.length / PAGE_SIZE)))
const paginatedItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return visibleItems.value.slice(start, start + PAGE_SIZE)
})

function setFilter(f: Filter) {
  filter.value = f
  page.value = 1
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }
}

async function load() {
  try {
    const response = await api.get<ApiResponse<Enrollment[]>>('/enrollments/me')
    items.value = response.data || []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải khóa học'
  }
}

async function issue(item: Enrollment) {
  issuingId.value = item.id
  error.value = ''
  try {
    await api.post<ApiResponse<Certificate>>(`/courses/${item.courseId}/certificates`)
    window.location.assign('/certificates')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Chưa đủ điều kiện cấp chứng chỉ'
  } finally {
    issuingId.value = ''
  }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="w-full px-2 py-4 sm:px-4 lg:px-4 space-y-4">
      <!-- 3 Metrics Cards (Sharp Flat) -->
      <section class="grid gap-2 sm:grid-cols-3">
        <article class="flex items-center gap-3 border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span class="grid h-10 w-10 shrink-0 place-items-center bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-bold">
            <BookOpen :size="18" />
          </span>
          <div>
            <p class="text-xl font-black text-slate-950 dark:text-white leading-tight">{{ items.length }}</p>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Khóa học đã đăng ký</p>
          </div>
        </article>

        <article class="flex items-center gap-3 border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span class="grid h-10 w-10 shrink-0 place-items-center bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
            <Clock :size="18" />
          </span>
          <div>
            <p class="text-xl font-black text-slate-950 dark:text-white leading-tight">{{ inProgress }}</p>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Đang học tích cực</p>
          </div>
        </article>

        <article class="flex items-center gap-3 border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span class="grid h-10 w-10 shrink-0 place-items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            <CheckCircle2 :size="18" />
          </span>
          <div>
            <p class="text-xl font-black text-slate-950 dark:text-white leading-tight">{{ completed }}</p>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Đã hoàn thành</p>
          </div>
        </article>
      </section>

      <!-- Tiến độ tổng quan -->
      <section v-if="items.length" class="border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">Tiến độ tổng quan</p>
          <p class="mt-1 text-base font-black text-slate-950 dark:text-white">{{ averageProgress }}% hành trình đã hoàn thành</p>
        </div>
        <div class="mt-3 h-2 overflow-hidden bg-slate-100 sm:mt-0 sm:w-80 dark:bg-slate-800 shrink-0">
          <div class="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500" :style="{ width: `${averageProgress}%` }" />
        </div>
      </section>

      <!-- Nút Khám phá khóa học được chuyển xuống dưới thẻ Tiến độ tổng quan -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <!-- Filter Tabs -->
        <div class="inline-flex border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button
            v-for="item in ([['ALL','Tất cả'],['LEARNING','Đang học'],['COMPLETED','Hoàn thành']] as const)"
            :key="item[0]"
            type="button"
            :class="[
              'px-3.5 py-2 text-xs font-bold transition',
              filter === item[0]
                ? 'bg-violet-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
            ]"
            @click="setFilter(item[0])"
          >
            {{ item[1] }}
          </button>
        </div>

        <!-- Action Links: Khám phá khóa học & Lịch sử đơn hàng -->
        <div class="flex items-center gap-3">
          <RouterLink
            to="/courses"
            class="inline-flex items-center gap-1.5 bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-violet-800 active:translate-y-px"
          >
            <Compass :size="14" />
            <span>Khám phá khóa học</span>
          </RouterLink>

          <RouterLink
            to="/orders"
            class="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline dark:text-purple-400"
          >
            <Receipt :size="14" />
            <span>Xem lịch sử đơn hàng →</span>
          </RouterLink>
        </div>
      </div>

      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <p v-if="error" class="border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>

      <!-- Empty State -->
      <section v-if="!api.loading.value && !items.length" class="border border-dashed border-slate-300 bg-white grid min-h-80 place-items-center p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <GraduationCap :size="36" class="mx-auto text-slate-400 mb-3" />
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Bắt đầu khóa học đầu tiên</h2>
          <p class="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Bạn chưa đăng ký khóa học nào. Khám phá danh mục và chọn kỹ năng bạn muốn phát triển.</p>
          <RouterLink
            to="/courses"
            class="mt-4 inline-flex items-center gap-1.5 bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800"
          >
            <Compass :size="15" />
            <span>Khám phá khóa học ngay</span>
          </RouterLink>
        </div>
      </section>

      <!-- Enrolled Courses Grid (Sharp Flat) -->
      <section v-else-if="paginatedItems.length" class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="item in paginatedItems"
          :key="item.id"
          class="flex flex-col border border-slate-200 bg-white shadow-xs transition hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <!-- Thumbnail & Status Badge -->
          <div class="relative overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <CourseThumbnail
              :src="item.course.thumbnailUrl"
              :alt="item.course.title"
              class="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <span
              class="absolute top-2.5 right-2.5 border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs"
              :class="[
                item.status === 'COMPLETED'
                  ? 'border-emerald-400 bg-emerald-600 text-white'
                  : 'border-amber-400 bg-amber-500 text-white',
              ]"
            >
              {{ item.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học' }}
            </span>
          </div>

          <!-- Body -->
          <div class="flex flex-1 flex-col p-4">
            <p class="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
              {{ item.course.category?.name || 'Khóa học' }}
            </p>
            <h2 class="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-snug text-slate-950 dark:text-white">
              {{ item.course.title }}
            </h2>
            <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.course.description || 'Tiếp tục nội dung bài giảng của bạn.' }}
            </p>

            <div class="mt-auto pt-4 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-slate-500">Tiến độ</span>
                <span class="text-purple-700 dark:text-purple-400">{{ Math.round(item.progressPercent) }}%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="mt-3.5 flex border border-slate-200 dark:border-slate-800">
              <RouterLink
                :to="`/learn/${item.courseId}`"
                class="flex flex-1 items-center justify-center gap-1.5 bg-violet-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800"
              >
                <PlayCircle :size="14" />
                <span>{{ item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học' }}</span>
              </RouterLink>

              <button
                v-if="item.status === 'COMPLETED'"
                type="button"
                :disabled="issuingId === item.id"
                class="inline-flex items-center gap-1 border-l border-slate-200 px-3 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 disabled:opacity-50 dark:border-slate-800 dark:text-purple-300 dark:hover:bg-slate-800"
                @click="issue(item)"
              >
                <Award :size="14" />
                <span>{{ issuingId === item.id ? 'Đang cấp...' : 'Chứng chỉ' }}</span>
              </button>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="items.length" class="border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Không có khóa học nào trong nhóm lọc này.
      </section>

      <!-- Pagination -->
      <nav v-if="paginatedItems.length > 0 && totalPages > 1" class="mt-8 flex items-center justify-center gap-1.5" aria-label="Phân trang">
        <button
          :disabled="page <= 1"
          class="flex h-8 items-center justify-center border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="goToPage(page - 1)"
        >
          ← Trước
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="[
            'grid h-8 w-8 place-items-center border text-xs font-bold transition',
            p === page
              ? 'border-violet-700 bg-violet-700 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-purple-400 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          ]"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          :disabled="page >= totalPages"
          class="flex h-8 items-center justify-center border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="goToPage(page + 1)"
        >
          Sau →
        </button>
      </nav>
    </main>
  </DefaultLayout>
</template>
