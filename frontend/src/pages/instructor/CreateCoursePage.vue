<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ImageFilePicker from '@/components/ui/ImageFilePicker.vue'
import { useCourseStore } from '@/stores/courses'
import { useCategoryStore } from '@/stores/categories'
import { CourseLevel } from '@/types'
import type { CourseFormData } from '@/types'

const router = useRouter()
const courseStore = useCourseStore()
const categoryStore = useCategoryStore()

const loading = ref(false)
const error = ref('')
const thumbnailFile = ref<File | null>(null)
const createdCourseId = ref<string | null>(null)

const form = ref<CourseFormData>({
  categoryId: '',
  title: '',
  description: '',
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
  if (form.value.title.trim().length > 255) { error.value = 'Tên khóa học không được vượt quá 255 ký tự'; return }
  if (!form.value.description.trim()) { error.value = 'Vui lòng nhập mô tả chi tiết'; return }
  if (!thumbnailFile.value && !createdCourseId.value) { error.value = 'Vui lòng chọn ảnh đại diện cho khóa học'; return }

  const priceNum = form.value.isFree ? 0 : Number(form.value.price)
  if (!form.value.isFree && (isNaN(priceNum) || priceNum <= 0)) {
    error.value = 'Vui lòng nhập học phí hợp lệ (lớn hơn 0 VND) khi không chọn Miễn phí'
    return
  }

  const payload: CourseFormData = {
    ...form.value,
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    price: priceNum,
    isFree: form.value.isFree,
    language: form.value.language.trim() || 'Vietnamese',
    requirements: form.value.requirements?.trim() || '',
    learningOutcomes: form.value.learningOutcomes?.trim() || '',
  }

  loading.value = true
  try {
    if (!createdCourseId.value) {
      const response = await courseStore.createCourse(payload)
      if (!response.data) throw new Error('Không nhận được thông tin khóa học vừa tạo')
      createdCourseId.value = response.data.id
    }
    if (thumbnailFile.value && createdCourseId.value) {
      await courseStore.uploadCourseThumbnail(createdCourseId.value, thumbnailFile.value)
    }
    router.push(`/instructor/courses/${createdCourseId.value}/builder`)
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
    <main class="course-editor-page">
      <header class="course-editor-header">
        <router-link to="/instructor/courses" class="course-editor-back" aria-label="Quay lại danh sách khóa học">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </router-link>
        <p class="course-editor-eyebrow">Quản lý khóa học</p>
        <h1>Tạo khóa học mới</h1>
        <p>Thiết lập thông tin nền tảng trước khi xây dựng chương và bài học.</p>
      </header>

      <div v-if="error" class="course-editor-alert">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <form class="course-editor-form" @submit.prevent="handleSubmit">
        <section class="course-form-section">
          <div class="course-form-section__heading"><span>01</span><div><h2>Thông tin cơ bản</h2><p>Tên, mô tả và cách phân loại khóa học.</p></div></div>
          <BaseInput id="course-title" v-model="form.title" label="Tên khóa học" placeholder="VD: Lập trình Vue.js từ cơ bản đến nâng cao" :required="true" />
          
          <div class="space-y-1.5">
            <label for="course-desc" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả <span class="text-red-500">*</span></label>
            <textarea id="course-desc" v-model="form.description" placeholder="Mô tả chi tiết..." rows="4" required class="course-control resize-none" />
          </div>

          <div class="space-y-1.5">
            <label for="course-cat" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Danh mục <span class="text-red-500">*</span></label>
            <select id="course-cat" v-model="form.categoryId" required class="course-control cursor-pointer">
              <option value="" disabled>Chọn danh mục</option>
              <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Cấp độ</label>
              <select v-model="form.level" class="course-control cursor-pointer">
                <option v-for="l in levels" :key="l.value" :value="l.value">{{ l.label }}</option>
              </select>
            </div>
            <BaseInput id="course-lang" v-model="form.language" label="Ngôn ngữ" placeholder="Vietnamese" />
          </div>
        </section>

        <section class="course-form-section">
          <div class="course-form-section__heading"><span>02</span><div><h2>Giá khóa học</h2><p>Chọn hình thức miễn phí hoặc thiết lập học phí.</p></div></div>
          <div class="flex items-center gap-3">
            <label class="course-check-label">
              <input v-model="form.isFree" type="checkbox" class="course-checkbox" />
              <span>Miễn phí</span>
            </label>
          </div>
          <BaseInput v-if="!form.isFree" id="course-price" v-model="form.price" label="Giá (VND)" type="number" placeholder="0" />
        </section>

        <section class="course-form-section">
          <div class="course-form-section__heading"><span>03</span><div><h2>Nội dung giới thiệu</h2><p>Kết quả học tập, yêu cầu đầu vào và ảnh đại diện.</p></div></div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Bạn sẽ học được gì</label>
            <textarea v-model="form.learningOutcomes" rows="4" placeholder="Liệt kê những gì học viên đạt được..." class="course-control resize-none" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Yêu cầu</label>
            <textarea v-model="form.requirements" rows="3" placeholder="Yêu cầu trước khi học..." class="course-control resize-none" />
          </div>
          <ImageFilePicker
            id="course-thumb"
            label="Ảnh đại diện khóa học"
            required
            :disabled="loading"
            @change="thumbnailFile = $event"
            @error="error = $event"
          />
        </section>

        <footer class="course-form-actions">
          <router-link to="/instructor/courses"><BaseButton variant="secondary">Hủy</BaseButton></router-link>
          <BaseButton type="submit" :loading="loading" size="lg">Tạo khóa học</BaseButton>
        </footer>
      </form>
    </main>
  </InstructorLayout>
</template>

<style scoped>
.course-editor-page{width:100%;max-width:68rem}.course-editor-header{border-bottom:1px solid var(--border);padding-bottom:1rem}.course-editor-back{display:grid;width:2.25rem;height:2.25rem;place-items:center;border:1px solid var(--border);color:var(--text-muted)}.course-editor-back:hover{border-color:var(--brand);color:var(--brand)}.course-editor-eyebrow{margin-top:.8rem;color:var(--brand)!important;font-size:.68rem!important;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.course-editor-header h1{margin-top:.2rem;font-size:1.85rem;line-height:1.15;font-weight:900}.course-editor-header>p:last-child{margin-top:.35rem;color:var(--text-muted);font-size:.85rem}.course-editor-alert{margin-top:1rem;border-left:3px solid #dc2626;background:#fef2f2;padding:.7rem .85rem}.course-editor-form{margin-top:1.25rem;border:1px solid var(--border);background:var(--surface)}.course-form-section{display:grid;grid-template-columns:15rem minmax(0,1fr);gap:1.5rem;padding:1.25rem}.course-form-section:not(:last-of-type){border-bottom:1px solid var(--border)}.course-form-section__heading{display:flex;align-items:flex-start;gap:.7rem}.course-form-section__heading>span{display:grid;width:2rem;height:2rem;place-items:center;background:var(--brand-soft);color:var(--brand);font-size:.68rem;font-weight:900}.course-form-section__heading h2{font-size:.9rem;font-weight:850}.course-form-section__heading p{margin-top:.2rem;color:var(--text-muted);font-size:.7rem;line-height:1.45}.course-form-section>:not(.course-form-section__heading){grid-column:2}.course-control{width:100%;min-height:2.75rem;border:1px solid var(--border);background:var(--surface-muted);padding:.7rem .8rem;color:var(--text);outline:none}.course-control:focus{border-color:var(--brand)}.course-check-label{display:inline-flex;align-items:center;gap:.6rem;cursor:pointer;color:var(--text);font-size:.8rem;font-weight:750}.course-checkbox{width:1.1rem;height:1.1rem;accent-color:var(--brand)}.course-form-actions{display:flex;justify-content:flex-end;gap:.65rem;border-top:1px solid var(--border);background:var(--surface-muted);padding:.9rem 1.25rem}.course-editor-page :deep(button),.course-editor-page :deep(input),.course-editor-page :deep(textarea),.course-editor-page :deep(select),.course-editor-page :deep([class*="rounded"]){border-radius:0!important}
@media(max-width:760px){.course-form-section{grid-template-columns:1fr}.course-form-section>:not(.course-form-section__heading){grid-column:1}.course-form-actions>*{flex:1}.course-form-actions :deep(button){width:100%}}
</style>
