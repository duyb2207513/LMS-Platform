<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import CourseCard from '@/components/course/CourseCard.vue'
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
const selectedFree = ref('')

const levels = [
  { value: '', label: 'Tất cả cấp độ' },
  { value: CourseLevel.BEGINNER, label: 'Cơ bản' },
  { value: CourseLevel.INTERMEDIATE, label: 'Trung cấp' },
  { value: CourseLevel.ADVANCED, label: 'Nâng cao' },
]

const priceFilters = [
  { value: '', label: 'Tất cả giá' },
  { value: 'true', label: 'Miễn phí' },
  { value: 'false', label: 'Có phí' },
]

function loadFiltersFromQuery() {
  search.value = (route.query.search as string) || ''
  selectedCategory.value = (route.query.categoryId as string) || ''
  selectedLevel.value = (route.query.level as string) || ''
  selectedFree.value = (route.query.isFree as string) || ''
}

async function fetchWithFilters(page = 1) {
  const filters: CourseFilters = { page, limit: 12 }
  if (search.value) filters.search = search.value
  if (selectedCategory.value) filters.categoryId = selectedCategory.value
  if (selectedLevel.value) filters.level = selectedLevel.value as CourseLevel
  if (selectedFree.value !== '') filters.isFree = selectedFree.value === 'true'

  // Update URL query
  const query: Record<string, string> = {}
  if (search.value) query.search = search.value
  if (selectedCategory.value) query.categoryId = selectedCategory.value
  if (selectedLevel.value) query.level = selectedLevel.value
  if (selectedFree.value) query.isFree = selectedFree.value
  if (page > 1) query.page = String(page)
  router.replace({ query })

  await courseStore.fetchCourses(filters)
}

function clearFilters() {
  search.value = ''
  selectedCategory.value = ''
  selectedLevel.value = ''
  selectedFree.value = ''
  fetchWithFilters()
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchWithFilters(), 400)
})

onMounted(async () => {
  loadFiltersFromQuery()
  await Promise.all([
    fetchWithFilters(Number(route.query.page) || 1),
    categoryStore.fetchCategories(),
  ])
})
</script>

<template>
  <DefaultLayout>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Khóa học</h1>
        <p class="mt-2 text-lg text-slate-500 dark:text-slate-400">Tìm kiếm và khám phá các khóa học phù hợp với bạn</p>
      </div>

      <!-- Filters -->
      <div class="mb-8 space-y-4">
        <!-- Search Bar -->
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Tìm kiếm khóa học..."
            class="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>

        <!-- Filter Chips -->
        <div class="flex flex-wrap gap-3">
          <!-- Category -->
          <select
            v-model="selectedCategory"
            @change="fetchWithFilters()"
            class="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">Tất cả danh mục</option>
            <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>

          <!-- Level -->
          <select
            v-model="selectedLevel"
            @change="fetchWithFilters()"
            class="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option v-for="lvl in levels" :key="lvl.value" :value="lvl.value">
              {{ lvl.label }}
            </option>
          </select>

          <!-- Price -->
          <select
            v-model="selectedFree"
            @change="fetchWithFilters()"
            class="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option v-for="pf in priceFilters" :key="pf.value" :value="pf.value">
              {{ pf.label }}
            </option>
          </select>

          <!-- Clear -->
          <button
            v-if="search || selectedCategory || selectedLevel || selectedFree"
            @click="clearFilters"
            class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="mb-6 flex items-center justify-between">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Tìm thấy <span class="font-semibold text-slate-700 dark:text-slate-300">{{ courseStore.meta.total }}</span> khóa học
        </p>
      </div>

      <!-- Course Grid -->
      <div v-if="courseStore.loading" class="py-12">
        <LoadingSpinner />
      </div>
      <div v-else-if="courseStore.courses.length === 0" class="text-center py-20">
        <svg class="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy khóa học nào</h3>
        <p class="text-slate-500 dark:text-slate-400 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
        <button @click="clearFilters" class="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 dark:bg-purple-950/40 text-white dark:text-purple-400 font-semibold hover:bg-purple-700 dark:hover:bg-purple-900/40 shadow-lg shadow-purple-500/25 transition-colors cursor-pointer">
          Xóa bộ lọc
        </button>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <CourseCard
          v-for="course in courseStore.courses"
          :key="course.id"
          :course="course"
        />
      </div>

      <!-- Pagination -->
      <div v-if="courseStore.meta.totalPages > 1" class="mt-12 flex items-center justify-center gap-2">
        <button
          v-for="page in courseStore.meta.totalPages"
          :key="page"
          @click="fetchWithFilters(page)"
          :class="[
            'w-10 h-10 rounded-xl text-sm font-semibold transition-all cursor-pointer',
            page === courseStore.meta.page
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-purple-600 hover:text-white hover:border-purple-600 dark:hover:border-purple-800 dark:hover:text-purple-400',
          ]"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </DefaultLayout>
</template>
