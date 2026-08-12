<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { API_BASE_URL, useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, Comment, CourseContent, CourseProgress, Lesson } from '@/types'

const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const content = ref<CourseContent | null>(null)
const progress = ref<CourseProgress | null>(null)
const selected = ref<Lesson | null>(null)
const comments = ref<Comment[]>([])
const text = ref('')
const replyTo = ref<string | null>(null)
const error = ref('')
const sidebarOpen = ref(false)
const courseId = String(route.params.courseId)
const lessons = computed(() => content.value?.sections.flatMap((section) => section.lessons) || [])
const lessonIndex = computed(() => lessons.value.findIndex((lesson) => lesson.id === selected.value?.id))
const previousLesson = computed(() => lessonIndex.value > 0 ? lessons.value[lessonIndex.value - 1] : null)
const nextLesson = computed(() => lessonIndex.value >= 0 ? lessons.value[lessonIndex.value + 1] || null : null)
const selectedSection = computed(() => content.value?.sections.find((section) => section.lessons.some((lesson) => lesson.id === selected.value?.id)))
const asset = (url: string | null) => !url ? '' : url.startsWith('http') ? url : `${API_BASE_URL.replace('/api/v1', '')}${url}`
const lessonTypeLabel = (type: Lesson['lessonType']) => ({ TEXT: 'Bài đọc', VIDEO: 'Video', DOCUMENT: 'Tài liệu' }[type])

async function load() {
  try {
    const selectedId = selected.value?.id
    const [courseResponse, progressResponse] = await Promise.all([
      api.get<ApiResponse<CourseContent>>(`/courses/${courseId}/content`),
      api.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`),
    ])
    content.value = courseResponse.data || null
    progress.value = progressResponse.data || null
    selected.value = selectedId ? lessons.value.find((lesson) => lesson.id === selectedId) || lessons.value[0] || null : lessons.value.find((lesson) => !lesson.progress?.isCompleted) || lessons.value[0] || null
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải nội dung khóa học' }
}

async function complete() {
  if (!selected.value) return
  await api.patch(`/lessons/${selected.value.id}/progress`, { isCompleted: !selected.value.progress?.isCompleted })
  await load()
}

function chooseLesson(lesson: Lesson) { selected.value = lesson; sidebarOpen.value = false; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function navigateLesson(lesson: Lesson | null) { if (lesson) chooseLesson(lesson) }

async function loadComments() {
  if (!selected.value) return
  try { const response = await api.get<ApiResponse<Comment[]>>(`/lessons/${selected.value.id}/comments`); comments.value = response.data || [] }
  catch { comments.value = [] }
}

async function send() {
  if (!selected.value || !text.value.trim()) return
  await api.post(`/lessons/${selected.value.id}/comments`, { content: text.value.trim(), parentId: replyTo.value })
  text.value = ''
  replyTo.value = null
  await loadComments()
}

async function remove(id: string) { await api.del(`/comments/${id}`); await loadComments() }
watch(() => selected.value?.id, () => void loadComments())
onMounted(load)
</script>

<template>
  <DefaultLayout>
    <div class="learning-shell">
      <button v-if="sidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" aria-label="Đóng mục lục" @click="sidebarOpen = false" />
      <aside :class="['learning-sidebar', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">
        <div class="border-b border-slate-200 p-5 dark:border-slate-800">
          <div class="flex items-start justify-between gap-3"><div><RouterLink to="/my-courses" class="text-xs font-bold text-purple-600 dark:text-purple-400">← Khóa học của tôi</RouterLink><h2 class="mt-3 line-clamp-2 text-lg font-black leading-snug">{{ content?.course.title }}</h2></div><button class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" @click="sidebarOpen = false">×</button></div>
          <div class="mt-5 flex justify-between text-xs font-semibold"><span>{{ progress?.completedLessons || 0 }}/{{ progress?.totalLessons || 0 }} bài</span><span>{{ Math.round(progress?.progressPercent || 0) }}%</span></div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" :style="{ width: `${progress?.progressPercent || 0}%` }" /></div>
        </div>
        <nav class="flex-1 overflow-y-auto p-3" aria-label="Nội dung khóa học">
          <section v-for="(section, sectionIndex) in content?.sections" :key="section.id" class="mb-4">
            <p class="px-2 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Chương {{ sectionIndex + 1 }}</p>
            <h3 class="px-2 pb-2 text-sm font-bold text-slate-800 dark:text-slate-200">{{ section.title }}</h3>
            <button v-for="lesson in section.lessons" :key="lesson.id" :class="['lesson-link', selected?.id === lesson.id ? 'lesson-link--active' : '']" @click="chooseLesson(lesson)">
              <span :class="['lesson-state', lesson.progress?.isCompleted ? 'lesson-state--done' : '']">{{ lesson.progress?.isCompleted ? '✓' : lesson.position }}</span>
              <span class="min-w-0 flex-1"><span class="line-clamp-2 font-semibold">{{ lesson.title }}</span><span class="mt-1 block text-[11px] opacity-65">{{ lessonTypeLabel(lesson.lessonType) }}<template v-if="lesson.durationSeconds"> · {{ Math.ceil(lesson.durationSeconds / 60) }} phút</template></span></span>
            </button>
          </section>
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        <header class="learning-topbar"><button class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 lg:hidden" @click="sidebarOpen = true">☰ Mục lục</button><p class="hidden min-w-0 text-sm text-slate-500 sm:block"><span class="font-semibold text-slate-700 dark:text-slate-300">{{ selectedSection?.title }}</span><span v-if="selected"> / {{ selected.title }}</span></p><span v-if="selected" :class="['rounded-full px-3 py-1 text-xs font-bold', selected.progress?.isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300']">{{ selected.progress?.isCompleted ? 'Đã hoàn thành' : 'Đang học' }}</span></header>
        <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <LoadingSpinner v-if="api.loading.value && !content" class="py-24" />
          <p v-else-if="error" class="rounded-2xl bg-red-50 p-4 text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
          <template v-else-if="selected">
            <div class="mb-6"><p class="text-xs font-extrabold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400">{{ lessonTypeLabel(selected.lessonType) }} · Bài {{ lessonIndex + 1 }}/{{ lessons.length }}</p><h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{{ selected.title }}</h1></div>
            <section class="viewer-shell" :class="selected.lessonType === 'TEXT' ? 'viewer-shell--text' : ''">
              <article v-if="selected.lessonType === 'TEXT'" class="lesson-prose whitespace-pre-line">{{ selected.content }}</article>
              <video v-else-if="selected.lessonType === 'VIDEO' && selected.videoUrl" :src="asset(selected.videoUrl)" controls class="max-h-[70vh] w-full bg-black" />
              <iframe v-else-if="selected.lessonType === 'DOCUMENT' && selected.documentUrl" :src="asset(selected.documentUrl)" class="h-[70vh] min-h-[520px] w-full" title="Tài liệu bài học" />
              <div v-else class="grid min-h-72 place-items-center p-8 text-center"><div><span class="text-4xl">◇</span><p class="mt-3 font-bold">Nội dung đang được cập nhật</p><p class="mt-1 text-sm text-slate-500">Giảng viên chưa tải nội dung cho bài học này.</p></div></div>
            </section>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3"><BaseButton variant="secondary" :disabled="!previousLesson" @click="navigateLesson(previousLesson)">← Bài trước</BaseButton><div class="flex flex-wrap gap-2"><RouterLink v-if="selected.quiz" :to="`/quiz/${selected.quiz.id}`"><BaseButton variant="outline">Làm quiz</BaseButton></RouterLink><BaseButton @click="complete">{{ selected.progress?.isCompleted ? 'Đánh dấu chưa xong' : '✓ Hoàn thành bài học' }}</BaseButton></div><BaseButton variant="secondary" :disabled="!nextLesson" @click="navigateLesson(nextLesson)">Bài tiếp →</BaseButton></div>

            <section class="surface-card mt-10 overflow-hidden">
              <header class="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6"><div class="flex items-center justify-between gap-4"><div><h2 class="text-xl font-black">Thảo luận bài học</h2><p class="mt-1 text-sm text-slate-500">Đặt câu hỏi và trao đổi cùng cộng đồng.</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ comments.length }} chủ đề</span></div></header>
              <div class="p-5 sm:p-6"><div v-if="replyTo" class="mb-3 flex items-center justify-between rounded-xl bg-purple-50 px-4 py-2 text-sm text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"><span>Đang trả lời một bình luận</span><button class="font-bold" @click="replyTo = null">Hủy</button></div><textarea v-model="text" rows="3" class="comment-box" placeholder="Viết câu hỏi hoặc chia sẻ của bạn..." /><div class="mt-3 flex justify-end"><BaseButton :disabled="!text.trim()" @click="send">Gửi bình luận</BaseButton></div></div>
              <div class="divide-y divide-slate-100 border-t border-slate-100 px-5 dark:divide-slate-800 dark:border-slate-800 sm:px-6">
                <article v-for="item in comments" :key="item.id" class="py-5"><div class="flex gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 font-bold text-white">{{ item.user.fullName.charAt(0) }}</span><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><b>{{ item.user.fullName }}</b><span class="text-xs text-slate-400">{{ new Date(item.createdAt).toLocaleDateString('vi-VN') }}</span></div><p class="mt-2 leading-7 text-slate-600 dark:text-slate-300">{{ item.isDeleted ? 'Bình luận đã được xóa' : item.content }}</p><div v-if="!item.isDeleted" class="mt-2"><button class="text-xs font-bold text-purple-600" @click="replyTo = item.id">Trả lời</button><button v-if="item.user.id === auth.user?.id" class="ml-4 text-xs font-bold text-red-600" @click="remove(item.id)">Xóa</button></div><div v-for="reply in item.replies" :key="reply.id" class="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-700">{{ reply.user.fullName.charAt(0) }}</span><div><b class="text-sm">{{ reply.user.fullName }}</b><p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ reply.isDeleted ? 'Bình luận đã được xóa' : reply.content }}</p></div></div></div></div></article>
                <p v-if="!comments.length" class="py-10 text-center text-sm text-slate-500">Chưa có thảo luận. Hãy đặt câu hỏi đầu tiên.</p>
              </div>
            </section>
          </template>
          <section v-else-if="content" class="surface-card grid min-h-72 place-items-center p-8 text-center text-slate-500">Khóa học chưa có bài học được xuất bản.</section>
        </div>
      </main>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.learning-shell{display:flex;min-height:calc(100vh - 4.5rem)}.learning-sidebar{position:fixed;inset:0 auto 0 0;z-index:40;display:flex;width:min(22rem,88vw);flex-direction:column;border-right:1px solid var(--border);background:var(--surface);padding-top:4.5rem;transition:transform .25s ease}.learning-topbar{position:sticky;top:4.5rem;z-index:20;display:flex;min-height:3.75rem;align-items:center;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--surface) 90%,transparent);padding:.75rem 1rem;backdrop-filter:blur(12px)}
.lesson-link{display:flex;width:100%;align-items:flex-start;gap:.75rem;border-radius:.9rem;padding:.7rem .6rem;text-align:left;color:var(--text-muted);transition:.18s}.lesson-link:hover{background:var(--surface-muted);color:var(--text)}.lesson-link--active{background:var(--brand-soft)!important;color:var(--brand)!important}.lesson-state{display:grid;width:1.7rem;height:1.7rem;flex-shrink:0;place-items:center;border:1px solid var(--border);border-radius:.6rem;font-size:.65rem;font-weight:800}.lesson-state--done{border-color:#10b981;background:#10b981;color:white}
.viewer-shell{overflow:hidden;border:1px solid var(--border);border-radius:1.35rem;background:var(--surface);box-shadow:var(--shadow-sm)}.viewer-shell--text{padding:clamp(1.5rem,5vw,4rem)}.lesson-prose{margin:auto;max-width:46rem;font-size:1.03rem;line-height:2;color:var(--text)}.comment-box{width:100%;resize:vertical;border:1px solid var(--border);border-radius:1rem;background:var(--surface-muted);padding:1rem;color:var(--text);outline:none}.comment-box:focus{border-color:#a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.1)}
@media(min-width:1024px){.learning-sidebar{position:sticky;top:4.5rem;z-index:10;height:calc(100vh - 4.5rem);width:21rem;padding-top:0}.learning-topbar{padding-inline:2rem}}
</style>
