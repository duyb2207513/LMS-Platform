<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCourseStore } from '@/stores/courses'
import { useCategoryStore } from '@/stores/categories'
import { CourseLevel } from '@/types'
import type { CourseFilters } from '@/types'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const categoryStore = useCategoryStore()
const search = ref('')
const selectedCategory = ref('')
const selectedLevel = ref('')
const selectedPrice = ref('')

const levels = [
  { value: '', label: 'Tất cả cấp độ' },
  { value: CourseLevel.BEGINNER, label: 'Cơ bản' },
  { value: CourseLevel.INTERMEDIATE, label: 'Trung cấp' },
  { value: CourseLevel.ADVANCED, label: 'Nâng cao' },
]
const priceOptions = [
  { value: '', label: 'Mọi mức giá' },
  { value: 'free', label: 'Miễn phí' },
  { value: 'paid', label: 'Có phí' },
  { value: 'price_asc', label: 'Giá thấp - cao' },
  { value: 'price_desc', label: 'Giá cao - thấp' },
]
const hasFilters = computed(() => Boolean(search.value || selectedCategory.value || selectedLevel.value || selectedPrice.value))

function loadFiltersFromQuery() {
  search.value = String(route.query.search || '')
  selectedCategory.value = String(route.query.categoryId || '')
  selectedLevel.value = String(route.query.level || '')
  
  const priceQ = String(route.query.price || '')
  const isFreeQ = String(route.query.isFree || '')
  const sortQ = String(route.query.sort || '')

  if (priceQ) {
    selectedPrice.value = priceQ
  } else if (isFreeQ === 'true') {
    selectedPrice.value = 'free'
  } else if (isFreeQ === 'false') {
    selectedPrice.value = 'paid'
  } else if (sortQ) {
    selectedPrice.value = sortQ
  } else {
    selectedPrice.value = ''
  }
}

async function fetchWithFilters(page = 1) {
  const filters: CourseFilters = { page, limit: 8 }
  if (search.value.trim()) filters.search = search.value.trim()
  if (selectedCategory.value) filters.categoryId = selectedCategory.value
  if (selectedLevel.value) filters.level = selectedLevel.value as CourseLevel

  if (selectedPrice.value === 'free') {
    filters.isFree = true
  } else if (selectedPrice.value === 'paid') {
    filters.isFree = false
  } else if (selectedPrice.value === 'price_asc') {
    filters.sortBy = 'price'
    filters.sortOrder = 'asc'
  } else if (selectedPrice.value === 'price_desc') {
    filters.sortBy = 'price'
    filters.sortOrder = 'desc'
  }

  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.categoryId) query.categoryId = filters.categoryId
  if (filters.level) query.level = filters.level
  if (selectedPrice.value) query.price = selectedPrice.value
  if (page > 1) query.page = String(page)

  await router.replace({ query })
  await courseStore.fetchCourses(filters)
}

function clearFilters() {
  search.value = ''
  selectedCategory.value = ''
  selectedLevel.value = ''
  selectedPrice.value = ''
  void fetchWithFilters()
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => void fetchWithFilters(), 450)
})

onMounted(async () => {
  loadFiltersFromQuery()
  await Promise.all([fetchWithFilters(Number(route.query.page) || 1), categoryStore.fetchCategories()])
})
</script>

<template>
  <DefaultLayout>
    <main class="app-page px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section class="catalog-hero overflow-hidden rounded-[2rem] px-6 py-9 text-white sm:px-10 sm:py-12">
        <div class="relative max-w-2xl">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <span class="h-2 w-2 rounded-full bg-emerald-300" /> Học theo tốc độ của bạn
          </span>
          <h1 class="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Khám phá khóa học phù hợp</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-purple-100 sm:text-base">Tìm nội dung chất lượng từ giảng viên, lọc nhanh theo chủ đề, cấp độ và ngân sách.</p>
        </div>
      </section>

      <section class="relative z-10 mx-2 -mt-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 sm:mx-5 sm:p-5">
        <label class="relative block">
          <span class="sr-only">Tìm kiếm khóa học</span>
          <svg class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
          <input v-model="search" class="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Tìm theo tên khóa học, kỹ năng..." />
        </label>
        <div class="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <select v-model="selectedCategory" class="filter-select" @change="fetchWithFilters()"><option value="">Tất cả danh mục</option><option v-for="category in categoryStore.categories" :key="category.id" :value="category.id">{{ category.name }}</option></select>
          <select v-model="selectedLevel" class="filter-select" @change="fetchWithFilters()"><option v-for="level in levels" :key="level.value" :value="level.value">{{ level.label }}</option></select>
          <select v-model="selectedPrice" class="filter-select" @change="fetchWithFilters()"><option v-for="price in priceOptions" :key="price.value" :value="price.value">{{ price.label }}</option></select>
          <BaseButton v-if="hasFilters" variant="ghost" size="sm" @click="clearFilters">Đặt lại</BaseButton>
        </div>
      </section>

      <div class="mb-5 mt-10 flex items-end justify-between gap-4">
        <div><h2 class="text-xl font-extrabold text-slate-950 dark:text-white">Tất cả khóa học</h2><p class="mt-1 text-sm text-slate-500">{{ courseStore.meta.total }} kết quả được tìm thấy</p></div>
      </div>

      <div v-if="courseStore.loading" class="surface-card grid min-h-72 place-items-center"><LoadingSpinner /></div>
      <section v-else-if="courseStore.courses.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CourseCard v-for="course in courseStore.courses" :key="course.id" :course="course" />
      </section>
      <section v-else class="surface-card grid min-h-80 place-items-center p-8 text-center">
        <div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-2xl dark:bg-purple-950/40">⌕</span><h2 class="mt-5 text-xl font-extrabold">Chưa tìm thấy khóa học</h2><p class="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.</p><BaseButton v-if="hasFilters" class="mt-5" variant="secondary" @click="clearFilters">Xóa bộ lọc</BaseButton></div>
      </section>

      <nav v-if="courseStore.courses.length > 0" class="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
        <button
          :disabled="courseStore.meta.page <= 1"
          class="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page - 1)"
        >
          ← Trước
        </button>
        <button
          v-for="page in (courseStore.meta.totalPages || 1)"
          :key="page"
          :class="[
            'grid h-10 w-10 place-items-center rounded-xl border text-sm font-bold transition',
            page === courseStore.meta.page
              ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          ]"
          @click="fetchWithFilters(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="courseStore.meta.page >= courseStore.meta.totalPages"
          class="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page + 1)"
        >
          Sau →
        </button>
      </nav>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.catalog-hero { position: relative; background: radial-gradient(circle at 80% 0%, rgba(236,72,153,.75), transparent 32%), linear-gradient(120deg, #4f46e5, #7c3aed 55%, #a21caf); box-shadow: 0 24px 60px rgba(109,40,217,.2); }
.catalog-hero::after { content: ''; position: absolute; width: 18rem; height: 18rem; right: 4%; bottom: -70%; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; box-shadow: 0 0 0 45px rgba(255,255,255,.05), 0 0 0 90px rgba(255,255,255,.04); }
.filter-select { min-height: 2.75rem; width: 100%; border: 1px solid var(--border); border-radius: .85rem; background: var(--surface-muted); padding: .65rem .9rem; color: var(--text); font-size: .875rem; font-weight: 600; outline: none; }
.filter-select:focus { border-color: #a855f7; box-shadow: 0 0 0 4px rgba(168,85,247,.1); }
</style>
