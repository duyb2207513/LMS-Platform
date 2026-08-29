<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Compass, RotateCcw, Search } from '@lucide/vue'
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
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = categoryId
  }
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
    <main class="w-full px-2 py-4 sm:px-4 lg:px-4 space-y-4">
      <!-- Category Strip -->
      <section class="flex h-10 w-full items-stretch border border-purple-200 bg-purple-50/60 dark:border-purple-900/60 dark:bg-slate-900" aria-label="Danh mục khóa học">
        <button
          type="button"
          class="hidden w-9 shrink-0 place-items-center border-r border-purple-200 text-purple-700 transition hover:bg-purple-100 sm:grid dark:border-purple-900 dark:hover:bg-purple-950"
          aria-label="Cuộn sang trái"
          @click="scrollCategories(-1)"
        >
          <ChevronLeft :size="16" />
        </button>

        <div ref="categoryScroller" class="category-scroll flex min-w-0 flex-1 items-stretch overflow-x-auto scroll-smooth">
          <button
            type="button"
            :class="[
              'shrink-0 whitespace-nowrap px-4 text-xs font-bold uppercase tracking-wider transition',
              !selectedCategory ? 'bg-violet-700 text-white' : 'text-slate-700 hover:bg-purple-100/70 hover:text-purple-900 dark:text-slate-300 dark:hover:bg-slate-800',
            ]"
            @click="selectCategory('')"
          >
            Tất cả danh mục
          </button>
          <button
            v-for="category in categoryStore.categories"
            :key="category.id"
            type="button"
            :class="[
              'shrink-0 whitespace-nowrap px-4 text-xs font-bold uppercase tracking-wider transition',
              selectedCategory === category.id
                ? 'bg-violet-700 text-white'
                : 'text-slate-700 hover:bg-purple-100/70 hover:text-purple-900 dark:text-slate-300 dark:hover:bg-slate-800',
            ]"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>

        <button
          type="button"
          class="hidden w-9 shrink-0 place-items-center border-l border-purple-200 text-purple-700 transition hover:bg-purple-100 sm:grid dark:border-purple-900 dark:hover:bg-purple-950"
          aria-label="Cuộn sang phải"
          @click="scrollCategories(1)"
        >
          <ChevronRight :size="16" />
        </button>
      </section>

      <!-- Search & Filters Bar (Sharp Flat Geometric) -->
      <section class="grid gap-0 border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-[minmax(18rem,2fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto] dark:border-slate-800 dark:bg-slate-900">
        <label class="relative block min-w-0">
          <span class="sr-only">Tìm kiếm khóa học</span>
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            class="h-10 w-full border-0 border-r border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-950 placeholder:text-slate-400 outline-none transition focus:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
            placeholder="Tìm theo tên khóa học hoặc kỹ năng..."
          />
        </label>
        <select v-model="selectedLevel" class="filter-select" @change="fetchWithFilters()">
          <option v-for="level in levels" :key="level.value" :value="level.value">{{ level.label }}</option>
        </select>
        <select v-model="selectedPrice" class="filter-select" @change="fetchWithFilters()">
          <option v-for="price in priceOptions" :key="price.value" :value="price.value">{{ price.label }}</option>
        </select>
        <button
          v-if="hasFilters"
          type="button"
          class="inline-flex h-10 items-center justify-center gap-1.5 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-slate-800 transition"
          @click="clearFilters"
        >
          <RotateCcw :size="13" />
          <span>Đặt lại</span>
        </button>
      </section>

      <!-- Heading & Count -->
      <div class="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 pt-2 dark:border-slate-800">
        <div>
          <h2 class="text-base font-black text-slate-950 dark:text-white leading-tight">
            {{ hasFilters ? 'Kết quả tìm kiếm' : 'Tất cả khóa học' }}
          </h2>
          <p class="mt-0.5 text-xs text-slate-500">
            {{ hasFilters ? `Tìm thấy ${courseStore.meta.total} khóa học phù hợp` : `Tổng cộng ${courseStore.meta.total} khóa học sẵn có` }}
          </p>
        </div>

        <span class="border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Trang {{ courseStore.meta.page }} / {{ courseStore.meta.totalPages || 1 }}
        </span>
      </div>

      <!-- Loading / Course Grid -->
      <div v-if="courseStore.loading" class="border border-slate-200 bg-white grid min-h-72 place-items-center dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner />
      </div>
      <section v-else-if="courseStore.courses.length" class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CourseCard v-for="course in courseStore.courses" :key="course.id" :course="course" />
      </section>
      <!-- Empty State -->
      <section v-else class="border border-dashed border-slate-300 bg-white grid min-h-80 place-items-center p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Compass :size="36" class="mx-auto text-slate-400" />
          <h2 class="mt-3 text-base font-bold text-slate-900 dark:text-white">Không tìm thấy khóa học phù hợp</h2>
          <p class="mt-1 text-xs text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc để xem thêm kết quả.</p>
          <button
            v-if="hasFilters"
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
            @click="clearFilters"
          >
            <RotateCcw :size="14" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      </section>

      <!-- Sharp Flat Pagination -->
      <nav v-if="courseStore.courses.length > 0 && courseStore.meta.totalPages > 1" class="mt-8 flex items-center justify-center gap-1.5" aria-label="Phân trang">
        <button
          :disabled="courseStore.meta.page <= 1"
          class="flex h-8 items-center justify-center border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page - 1)"
        >
          ← Trước
        </button>
        <button
          v-for="page in (courseStore.meta.totalPages || 1)"
          :key="page"
          :class="[
            'grid h-8 w-8 place-items-center border text-xs font-bold transition',
            page === courseStore.meta.page
              ? 'border-violet-700 bg-violet-700 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-purple-400 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          ]"
          @click="fetchWithFilters(page)"
        >
          {{ page }}
        </button>
        <button
          :disabled="courseStore.meta.page >= courseStore.meta.totalPages"
          class="flex h-8 items-center justify-center border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-purple-400 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          @click="fetchWithFilters(courseStore.meta.page + 1)"
        >
          Sau →
        </button>
      </nav>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.filter-select {
  min-height: 2.5rem;
  width: 100%;
  border: 0;
  border-right: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface-muted);
  padding: 0.45rem 0.65rem;
  color: var(--text);
  font-size: 0.75rem;
  font-weight: 600;
  outline: none;
}
.filter-select:focus {
  background: var(--surface);
  box-shadow: inset 0 -2px 0 #7c3aed;
}
.category-scroll {
  scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar {
  display: none;
}
</style>
