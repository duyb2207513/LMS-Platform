<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
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

const channels = [
  { key: 'inAppEnabled' as const, title: 'Thông báo trên website', description: 'Hiển thị chuông và thông báo theo thời gian thực.' },
  { key: 'emailEnabled' as const, title: 'Thông báo qua email', description: 'Gửi cập nhật đến địa chỉ email đã đăng ký.' },
]

const topics = [
  { key: 'courseUpdates' as const, title: 'Cập nhật khóa học', description: 'Bài học, tài liệu và thông báo mới từ giảng viên.' },
  { key: 'assignmentReminders' as const, title: 'Nhắc hạn bài tập', description: 'Nhắc khi bài tập sắp đến hạn nộp.' },
  { key: 'quizResults' as const, title: 'Kết quả Quiz', description: 'Điểm số và kết quả sau khi hoàn thành Quiz.' },
  { key: 'certificateUpdates' as const, title: 'Chứng chỉ khóa học', description: 'Thông báo khi chứng chỉ mới được phát hành.' },
]

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
  } catch {
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
    await notificationStore.updatePreferences({ ...form })
    successMessage.value = 'Đã lưu tùy chọn thông báo.'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (caught) {
    errorMessage.value = caught instanceof Error ? caught.message : 'Không thể lưu cài đặt.'
  } finally {
    saving.value = false
  }
}

onMounted(loadPreferences)
</script>

<template>
  <DefaultLayout>
    <main class="w-full px-2 py-6 sm:px-3 lg:px-2">
      <header class="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <RouterLink to="/notifications" class="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800">
            Trung tâm thông báo
          </RouterLink>
          <h1 class="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">Cài đặt thông báo</h1>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Chọn kênh và nội dung bạn muốn nhận.</p>
        </div>

        <button type="button" class="inline-flex h-9 items-center gap-1.5 bg-violet-700 px-4 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving || loading" @click="save">
          {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </header>

      <div v-if="loading" class="py-12 text-center"><LoadingSpinner /></div>

      <form v-else class="mt-4" @submit.prevent="save">
        <div v-if="successMessage" class="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{{ successMessage }}</div>
        <div v-if="errorMessage" class="mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{{ errorMessage }}</div>

        <div class="grid gap-4 xl:grid-cols-2">
          <section>
            <div class="mb-2 flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">Kênh nhận thông báo</h2>
              <span class="text-[10px] uppercase tracking-wider text-slate-400">2 tùy chọn</span>
            </div>
            <div class="divide-y divide-slate-200 border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              <label v-for="item in channels" :key="item.key" class="flex min-h-16 cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/70">
                <span class="min-w-0 flex-1"><b class="block text-xs text-slate-900 dark:text-white">{{ item.title }}</b><span class="block truncate text-[11px] text-slate-500">{{ item.description }}</span></span>
                <input v-model="form[item.key]" type="checkbox" class="h-4 w-4 shrink-0 accent-violet-600" />
              </label>
            </div>
          </section>

          <section>
            <div class="mb-2 flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">Chủ đề và sự kiện</h2>
              <span class="text-[10px] uppercase tracking-wider text-slate-400">4 tùy chọn</span>
            </div>
            <div class="divide-y divide-slate-200 border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              <label v-for="item in topics" :key="item.key" class="flex min-h-16 cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/70">
                <span class="min-w-0 flex-1"><b class="block text-xs text-slate-900 dark:text-white">{{ item.title }}</b><span class="block truncate text-[11px] text-slate-500">{{ item.description }}</span></span>
                <input v-model="form[item.key]" type="checkbox" class="h-4 w-4 shrink-0 accent-violet-600" />
              </label>
            </div>
          </section>
        </div>
      </form>
    </main>
  </DefaultLayout>
</template>
