<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const averageProgress = computed(() => items.value.length ? Math.round(items.value.reduce((sum, item) => sum + item.progressPercent, 0) / items.value.length) : 0)
const visibleItems = computed(() => items.value.filter((item) => filter.value === 'ALL' || (filter.value === 'COMPLETED' ? item.status === 'COMPLETED' : item.status !== 'COMPLETED')))
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
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải khóa học' }
}

async function issue(item: Enrollment) {
  issuingId.value = item.id
  error.value = ''
  try {
    await api.post<ApiResponse<Certificate>>(`/courses/${item.courseId}/certificates`)
    window.location.assign('/certificates')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Chưa đủ điều kiện cấp chứng chỉ' }
  finally { issuingId.value = '' }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="app-page navbar-page">
      <div class="flex items-center justify-end">
        <RouterLink to="/courses"><BaseButton class="!rounded-none" variant="secondary">Khám phá khóa học</BaseButton></RouterLink>
      </div>

      <section class="mt-5 grid gap-2 sm:grid-cols-3">
        <article class="metric-card"><span class="metric-icon bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">▤</span><div><p class="metric-value">{{ items.length }}</p><p class="metric-label">Khóa học đã đăng ký</p></div></article>
        <article class="metric-card"><span class="metric-icon bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">◔</span><div><p class="metric-value">{{ inProgress }}</p><p class="metric-label">Đang học</p></div></article>
        <article class="metric-card"><span class="metric-icon bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">✓</span><div><p class="metric-value">{{ completed }}</p><p class="metric-label">Đã hoàn thành</p></div></article>
      </section>

      <section v-if="items.length" class="mt-3 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex sm:items-center sm:justify-between">
        <div><p class="text-xs font-semibold text-slate-500">Tiến độ tổng quan</p><p class="mt-0.5 text-lg font-black text-slate-950 dark:text-white">{{ averageProgress }}% hành trình đã hoàn thành</p></div><div class="mt-3 h-2.5 overflow-hidden bg-slate-100 sm:mt-0 sm:w-72 dark:bg-slate-800"><div class="h-full bg-amber-400 transition-all" :style="{ width: `${averageProgress}%` }" /></div>
      </section>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <button v-for="item in ([['ALL','Tất cả'],['LEARNING','Đang học'],['COMPLETED','Hoàn thành']] as const)" :key="item[0]" :class="['px-3 py-2 text-xs font-semibold transition', filter === item[0] ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-950 dark:hover:text-white']" @click="setFilter(item[0])">{{ item[1] }}</button>
        </div>
        <RouterLink to="/orders" class="text-sm font-bold text-purple-700 hover:underline dark:text-purple-300">Xem lịch sử đơn hàng →</RouterLink>
      </div>

      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <p v-if="error" class="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
      <section v-if="!api.loading.value && !items.length" class="surface-card mt-6 grid min-h-80 place-items-center p-8 text-center"><div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-950/40">♢</span><h2 class="mt-5 text-xl font-extrabold">Bắt đầu khóa học đầu tiên</h2><p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">Bạn chưa đăng ký khóa học nào. Khám phá danh mục và chọn kỹ năng bạn muốn phát triển.</p><RouterLink to="/courses"><BaseButton class="mt-5">Khám phá ngay</BaseButton></RouterLink></div></section>
      <section v-else-if="paginatedItems.length" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article v-for="item in paginatedItems" :key="item.id" class="learning-card group">
          <div class="learning-card__media-wrap">
            <CourseThumbnail :src="item.course.thumbnailUrl" :alt="item.course.title" class="learning-card__media transition-transform duration-500 group-hover:scale-[1.025]" />
            <span :class="['learning-card__status', item.status === 'COMPLETED' ? 'learning-card__status--completed' : 'learning-card__status--active']">
              {{ item.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học' }}
            </span>
          </div>

          <div class="learning-card__body">
            <p class="learning-card__category">{{ item.course.category?.name || 'Khóa học' }}</p>
            <h2>{{ item.course.title }}</h2>
            <p class="learning-card__description">{{ item.course.description || 'Tiếp tục nội dung khóa học của bạn.' }}</p>

            <div class="learning-card__progress">
              <div><span>Tiến độ học tập</span><strong>{{ Math.round(item.progressPercent) }}%</strong></div>
              <div class="learning-card__track"><div :style="{ width: `${item.progressPercent}%` }" /></div>
            </div>

            <div class="learning-card__actions">
              <RouterLink :to="`/learn/${item.courseId}`">{{ item.progressPercent ? 'Tiếp tục học' : 'Bắt đầu học' }}</RouterLink>
              <button v-if="item.status === 'COMPLETED'" type="button" :disabled="issuingId === item.id" @click="issue(item)">
                {{ issuingId === item.id ? 'Đang cấp...' : 'Chứng chỉ' }}
              </button>
            </div>
          </div>
        </article>
      </section>
      <section v-else-if="items.length" class="surface-card mt-6 p-10 text-center text-sm text-slate-500">Không có khóa học trong nhóm này.</section>

      <nav v-if="paginatedItems.length > 0" class="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
        <button
          :disabled="page <= 1"
          class="flex h-9 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="goToPage(page - 1)"
        >
          ← Trước
        </button>
        <button
          v-for="p in totalPages"
          :key="p"
          :class="[
            'grid h-9 w-9 place-items-center border text-xs font-bold transition',
            p === page
              ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          ]"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          :disabled="page >= totalPages"
          class="flex h-9 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="goToPage(page + 1)"
        >
          Sau →
        </button>
      </nav>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.metric-card { display:flex; align-items:center; gap:.75rem; border:1px solid var(--border); background:var(--surface); padding:.8rem 1rem }.metric-icon{display:grid;width:2.5rem;height:2.5rem;flex-shrink:0;place-items:center;font-weight:900}.metric-value{font-size:1.15rem;font-weight:900;line-height:1}.metric-label{margin-top:.25rem;color:var(--text-muted);font-size:.7rem}
.learning-card{display:flex;min-height:100%;flex-direction:column;overflow:hidden;border:1px solid var(--border);background:var(--surface);transition:border-color 180ms ease,background-color 180ms ease}.learning-card:hover{border-color:rgba(124,58,237,.5);background:rgba(245,243,255,.35)}.learning-card__media-wrap{position:relative;overflow:hidden}.learning-card__media{width:100%;aspect-ratio:16/9}.learning-card__status{position:absolute;right:.75rem;top:.75rem;padding:.3rem .55rem;font-size:.65rem;font-weight:850}.learning-card__status--active{background:#fef3c7;color:#b45309}.learning-card__status--completed{background:#10b981;color:white}.learning-card__body{display:flex;min-height:14.5rem;flex:1;flex-direction:column;padding:1rem}.learning-card__category{color:var(--brand);font-size:.65rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.learning-card h2{display:-webkit-box;overflow:hidden;margin-top:.45rem;color:var(--text);font-size:1.05rem;font-weight:850;line-height:1.35;letter-spacing:-.015em;-webkit-line-clamp:2;-webkit-box-orient:vertical}.learning-card__description{display:-webkit-box;overflow:hidden;margin-top:.45rem;color:var(--text-muted);font-size:.75rem;line-height:1.5;-webkit-line-clamp:2;-webkit-box-orient:vertical}.learning-card__progress{margin-top:auto;padding-top:1rem}.learning-card__progress>div:first-child{display:flex;align-items:center;justify-content:space-between;color:var(--text-muted);font-size:.68rem;font-weight:650}.learning-card__progress strong{color:var(--text);font-size:.7rem}.learning-card__track{height:.4rem;margin-top:.45rem;background:var(--surface-muted)}.learning-card__track>div{height:100%;background:#fbbf24;transition:width 250ms ease}.learning-card__actions{display:flex;margin-top:.8rem;border:1px solid var(--border)}.learning-card__actions a,.learning-card__actions button{display:flex;min-height:2.5rem;flex:1;align-items:center;justify-content:center;border:0;background:transparent;color:var(--text-muted);font-size:.75rem;font-weight:800}.learning-card__actions a{background:var(--brand);color:white}.learning-card__actions a:hover{background:var(--brand-hover)}.learning-card__actions button{border-left:1px solid var(--border)}.learning-card__actions button:hover{background:var(--surface-muted);color:var(--brand)}.learning-card__actions button:disabled{cursor:not-allowed;opacity:.6}
</style>
