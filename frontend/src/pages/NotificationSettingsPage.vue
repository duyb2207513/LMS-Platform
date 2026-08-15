<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()
const loading = ref(false)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  inAppEnabled: true,
  emailEnabled: true,
  courseUpdates: true,
  assignmentReminders: true,
  quizResults: true,
  certificateUpdates: true,
})

async function loadPreferences() {
  loading.value = true
  errorMessage.value = ''
  try {
    const prefs = await notificationStore.fetchPreferences()
    if (prefs) {
      form.inAppEnabled = prefs.inAppEnabled ?? true
      form.emailEnabled = prefs.emailEnabled ?? true
      form.courseUpdates = prefs.courseUpdates ?? true
      form.assignmentReminders = prefs.assignmentReminders ?? true
      form.quizResults = prefs.quizResults ?? true
      form.certificateUpdates = prefs.certificateUpdates ?? true
    }
  } catch (e) {
    errorMessage.value = 'Không thể tải cài đặt thông báo.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    await notificationStore.updatePreferences({
      inAppEnabled: form.inAppEnabled,
      emailEnabled: form.emailEnabled,
      courseUpdates: form.courseUpdates,
      assignmentReminders: form.assignmentReminders,
      quizResults: form.quizResults,
      certificateUpdates: form.certificateUpdates,
    })
    successMessage.value = 'Đã lưu tùy chọn thông báo thành công!'
    setTimeout(() => {
      successMessage.value = ''
    }, 4000)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Lỗi khi lưu cài đặt.'
  } finally {
    saving.value = false
  }
}

onMounted(loadPreferences)
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Breadcrumb / Back -->
      <div class="mb-6">
        <RouterLink
          to="/notifications"
          class="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          ← Quay lại Trung tâm thông báo
        </RouterLink>
      </div>

      <div class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-950 dark:text-white">Cài đặt thông báo</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tùy chỉnh kênh và loại thông báo bạn muốn nhận từ LMS Platform
          </p>
        </div>

        <div v-if="loading" class="py-12 text-center">
          <LoadingSpinner />
        </div>

        <form v-else class="mt-8 space-y-8" @submit.prevent="save">
          <!-- Alert feedback -->
          <div
            v-if="successMessage"
            class="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            ✓ {{ successMessage }}
          </div>
          <div
            v-if="errorMessage"
            class="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            ✕ {{ errorMessage }}
          </div>

          <!-- Kênh nhận thông báo -->
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Kênh nhận thông báo</h2>
            <div class="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 p-2 dark:divide-slate-800 dark:border-slate-800">
              <!-- In-app toggle -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Thông báo trên Website (In-app)</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Nhận biểu tượng chuông và popup thời gian thực trên website</p>
                </div>
                <input
                  v-model="form.inAppEnabled"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <!-- Email toggle -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Email thông báo</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Nhận thư gửi về hộp thư điện tử đã đăng ký</p>
                </div>
                <input
                  v-model="form.emailEnabled"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
          </div>

          <!-- Các chủ đề thông báo -->
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Chủ đề & Sự kiện</h2>
            <div class="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 p-2 dark:divide-slate-800 dark:border-slate-800">
              <!-- Course updates -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Cập nhật khóa học & Thông báo giảng viên</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Khi giảng viên đăng bài giảng mới, tài liệu hoặc thông báo quan trọng</p>
                </div>
                <input
                  v-model="form.courseUpdates"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <!-- Assignment reminders -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Nhắc hạn nộp bài tập (Assignment)</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Nhận thông báo khi sắp đến hạn nộp bài tập trong khóa học</p>
                </div>
                <input
                  v-model="form.assignmentReminders"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <!-- Quiz results -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Kết quả bài trắc nghiệm (Quiz)</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Thông báo điểm số và nhận xét sau khi hoàn thành Quiz</p>
                </div>
                <input
                  v-model="form.quizResults"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>

              <!-- Certificate updates -->
              <label class="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Chứng chỉ hoàn thành khóa học</span>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Nhận thông báo ngay khi chứng chỉ của bạn được cấp</p>
                </div>
                <input
                  v-model="form.certificateUpdates"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end pt-2">
            <BaseButton type="submit" :loading="saving">
              Lưu thay đổi
            </BaseButton>
          </div>
        </form>
      </div>
    </main>
  </DefaultLayout>
</template>
