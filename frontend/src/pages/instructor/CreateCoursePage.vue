<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCourseStore } from '@/stores/courses'
import { useCategoryStore } from '@/stores/categories'
import { CourseLevel } from '@/types'
import type { CourseFormData } from '@/types'

const router = useRouter()
const courseStore = useCourseStore()
const categoryStore = useCategoryStore()

const loading = ref(false)
const error = ref('')

const form = ref<CourseFormData>({
  categoryId: '',
  title: '',
  description: '',
  thumbnailUrl: '',
  level: CourseLevel.BEGINNER,
  price: 0,
  isFree: true,
  language: 'Vietnamese',
  requirements: '',
  learningOutcomes: '',
})

const levels = [
  { value: CourseLevel.BEGINNER, label: 'Cơ bản' },
  { value: CourseLevel.INTERMEDIATE, label: 'Trung cấp' },
  { value: CourseLevel.ADVANCED, label: 'Nâng cao' },
]

async function handleSubmit() {
  error.value = ''
  if (!form.value.categoryId) { error.value = 'Vui lòng chọn danh mục'; return }
  if (!form.value.title.trim()) { error.value = 'Vui lòng nhập tên khóa học'; return }
  if (!form.value.description.trim()) { error.value = 'Vui lòng nhập mô tả'; return }

  loading.value = true
  try {
    const response = await courseStore.createCourse(form.value)
    if (response.data) router.push(`/instructor/courses/${response.data.id}/builder`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Tạo khóa học thất bại'
  } finally {
    loading.value = false
  }
}

onMounted(() => { categoryStore.fetchCategories() })
</script>

<template>
  <InstructorLayout>
    <div class="max-w-3xl">
      <div class="mb-8">
        <router-link to="/instructor/courses" class="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Quay lại danh sách
        </router-link>
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Tạo khóa học mới</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Điền thông tin chi tiết cho khóa học của bạn</p>
      </div>

      <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 text-sm text-red-600">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-8">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-5 transition-colors duration-300">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Thông tin cơ bản</h2>
          <BaseInput id="course-title" v-model="form.title" label="Tên khóa học" placeholder="VD: Lập trình Vue.js từ cơ bản đến nâng cao" :required="true" />
          
          <div class="space-y-1.5">
            <label for="course-desc" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả <span class="text-red-500">*</span></label>
            <textarea id="course-desc" v-model="form.description" placeholder="Mô tả chi tiết..." rows="4" required class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none resize-none transition-colors duration-200" />
          </div>

          <div class="space-y-1.5">
            <label for="course-cat" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Danh mục <span class="text-red-500">*</span></label>
            <select id="course-cat" v-model="form.categoryId" required class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none cursor-pointer transition-colors duration-200">
              <option value="" disabled>Chọn danh mục</option>
              <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Cấp độ</label>
              <select v-model="form.level" class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none cursor-pointer transition-colors duration-200">
                <option v-for="l in levels" :key="l.value" :value="l.value">{{ l.label }}</option>
              </select>
            </div>
            <BaseInput id="course-lang" v-model="form.language" label="Ngôn ngữ" placeholder="Vietnamese" />
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-5 transition-colors duration-300">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Giá khóa học</h2>
          <div class="flex items-center gap-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.isFree" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Miễn phí</span>
          </div>
          <BaseInput v-if="!form.isFree" id="course-price" v-model="form.price" label="Giá (VND)" type="number" placeholder="0" />
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-5 transition-colors duration-300">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Chi tiết</h2>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Bạn sẽ học được gì</label>
            <textarea v-model="form.learningOutcomes" rows="4" placeholder="Liệt kê những gì học viên đạt được..." class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none resize-none transition-colors duration-200" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Yêu cầu</label>
            <textarea v-model="form.requirements" rows="3" placeholder="Yêu cầu trước khi học..." class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none resize-none transition-colors duration-200" />
          </div>
          <BaseInput id="course-thumb" v-model="form.thumbnailUrl" label="URL hình ảnh đại diện" placeholder="https://example.com/image.jpg" />
        </div>

        <div class="flex justify-end gap-4">
          <router-link to="/instructor/courses"><BaseButton variant="secondary">Hủy</BaseButton></router-link>
          <BaseButton type="submit" :loading="loading" size="lg">Tạo khóa học</BaseButton>
        </div>
      </form>
    </div>
  </InstructorLayout>
</template>
