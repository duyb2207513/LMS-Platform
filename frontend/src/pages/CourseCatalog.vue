<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
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
const categoryScroller = ref<HTMLElement | null>(null)

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

async function selectCategory(categoryId: string) {
  if (selectedCategory.value === categoryId) return
  selectedCategory.value = categoryId
  await fetchWithFilters()
}

function scrollCategories(direction: -1 | 1) {
  categoryScroller.value?.scrollBy({ left: direction * 320, behavior: 'smooth' })
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
    <main class="app-page navbar-page catalog-page">
      <section class="flex h-11 w-full items-stretch overflow-hidden border border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-slate-900" aria-label="Danh mục khóa học">
        <button type="button" class="hidden w-10 shrink-0 place-items-center border-r border-violet-200 text-violet-600 transition hover:bg-violet-100 hover:text-violet-800 sm:grid dark:border-violet-900 dark:hover:bg-violet-950" aria-label="Cuộn danh mục sang trái" @click="scrollCategories(-1)">
          <ChevronLeft :size="18" :stroke-width="2" />
        </button>
        <div ref="categoryScroller" class="category-scroll flex min-w-0 flex-1 items-stretch overflow-x-auto scroll-smooth">
          <button v-for="category in categoryStore.categories" :key="category.id" type="button" :class="['shrink-0 whitespace-nowrap px-4 text-xs font-bold uppercase tracking-[0.08em] transition', selectedCategory === category.id ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-violet-100 hover:text-violet-800 dark:text-slate-300 dark:hover:bg-violet-950 dark:hover:text-violet-200']" @click="selectCategory(category.id)">{{ category.name }}</button>
        </div>
        <button type="button" class="hidden w-10 shrink-0 place-items-center border-l border-violet-200 text-violet-600 transition hover:bg-violet-100 hover:text-violet-800 sm:grid dark:border-violet-900 dark:hover:bg-violet-950" aria-label="Cuộn danh mục sang phải" @click="scrollCategories(1)">
          <ChevronRight :size="18" :stroke-width="2" />
        </button>
      </section>

      <section class="grid gap-0 border-x border-b border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-[minmax(18rem,2fr)_minmax(9rem,1fr)_minmax(9rem,1fr)_auto] dark:border-slate-700 dark:bg-slate-900">
        <label class="relative block min-w-0">
          <span class="sr-only">Tìm kiếm khóa học</span>
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
          <input v-model="search" class="h-10 w-full border-0 border-r border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-950 outline-none transition focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Tìm tên khóa học hoặc kỹ năng..." />
        </label>
        <select v-model="selectedLevel" class="filter-select" @change="fetchWithFilters()"><option v-for="level in levels" :key="level.value" :value="level.value">{{ level.label }}</option></select>
        <select v-model="selectedPrice" class="filter-select" @change="fetchWithFilters()"><option v-for="price in priceOptions" :key="price.value" :value="price.value">{{ price.label }}</option></select>
        <BaseButton v-if="hasFilters" class="!h-10 !rounded-none !border-0 !px-3 !text-xs" variant="ghost" size="sm" @click="clearFilters">Đặt lại</BaseButton>
      </section>

      <div class="mb-3 mt-6 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-lg font-extrabold text-slate-950 dark:text-white">{{ hasFilters ? 'Kết quả tìm kiếm' : 'Tất cả khóa học' }}</h2>
          <p class="mt-0.5 text-xs text-slate-500">{{ hasFilters ? `Tìm thấy ${courseStore.meta.total} khóa học` : `${courseStore.meta.total} khóa học` }}</p>
        </div>
      </div>

      <div v-if="courseStore.loading" class="surface-card grid min-h-72 place-items-center"><LoadingSpinner /></div>
      <section v-else-if="courseStore.courses.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CourseCard v-for="course in courseStore.courses" :key="course.id" :course="course" />
      </section>
      <section v-else class="surface-card grid min-h-80 place-items-center p-8 text-center">
        <div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-2xl dark:bg-purple-950/40">⌕</span><h2 class="mt-5 text-xl font-extrabold">Chưa tìm thấy khóa học</h2><p class="mt-2 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.</p><BaseButton v-if="hasFilters" class="mt-5" variant="secondary" @click="clearFilters">Xóa bộ lọc</BaseButton></div>
      </section>

      <nav v-if="courseStore.courses.length > 0" class="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
        <button
          :disabled="courseStore.meta.page <= 1"
          class="flex h-9 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page - 1)"
        >
          ← Trước
        </button>
        <button
          v-for="page in (courseStore.meta.totalPages || 1)"
          :key="page"
          :class="[
            'grid h-9 w-9 place-items-center border text-xs font-bold transition',
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
          class="flex h-9 items-center justify-center border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page + 1)"
        >
          Sau →
        </button>
      </nav>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.catalog-page { padding-top: 0 !important; }
.filter-select { min-height: 2.5rem; width: 100%; border: 0; border-right: 1px solid var(--border); border-radius: 0; background: var(--surface-muted); padding: .45rem .65rem; color: var(--text); font-size: .75rem; font-weight: 600; outline: none; }
.filter-select:focus { background: var(--surface); box-shadow: inset 0 -2px 0 #7c3aed; }
.category-scroll { scrollbar-width: none; }
.category-scroll::-webkit-scrollbar { display: none; }
</style>
