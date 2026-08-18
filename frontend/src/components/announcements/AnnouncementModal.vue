<script setup lang="ts">
import { reactive, watch } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { CourseAnnouncement, AnnouncementFormData } from '@/types'

const props = defineProps<{
  open: boolean
  announcement?: CourseAnnouncement | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: AnnouncementFormData]
}>()

const form = reactive<AnnouncementFormData>({
  title: '',
  content: '',
})

watch(
  () => props.announcement,
  (val) => {
    if (val) {
      form.title = val.title || ''
      form.content = val.content || ''
    } else {
      form.title = ''
      form.content = ''
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!form.title.trim() || !form.content.trim()) return
  emit('submit', {
    title: form.title.trim(),
    content: form.content.trim(),
  })
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">
            {{ announcement ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới' }}
          </h3>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            @click="$emit('close')"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form class="mt-5 space-y-4" @submit.prevent="handleSubmit">
          <BaseInput
            id="announcement-title"
            v-model="form.title"
            label="Tiêu đề thông báo"
            placeholder="Ví dụ: Thay đổi lịch nộp bài tập / Lịch học bù"
            required
          />

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nội dung thông báo <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.content"
              rows="5"
              required
              class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Nhập nội dung chi tiết thông báo cho học viên của khóa học..."
            />
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <BaseButton type="button" variant="outline" @click="$emit('close')">
              Hủy
            </BaseButton>
            <BaseButton type="submit" :loading="loading">
              {{ announcement ? 'Lưu cập nhật' : 'Tạo bản nháp' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>
