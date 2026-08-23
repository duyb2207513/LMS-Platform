<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { API_BASE_URL, useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, Comment, CourseContent, CourseProgress, Lesson } from '@/types'
import VueOfficePdf from '@vue-office/pdf'
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'
import VueOfficePptx from '@vue-office/pptx'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Menu,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from '@lucide/vue'

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
const sidebarCollapsed = ref(false)
const courseId = String(route.params.courseId)
const lessons = computed(() => content.value?.sections.flatMap((section) => section.lessons) || [])
const lessonIndex = computed(() => lessons.value.findIndex((lesson) => lesson.id === selected.value?.id))
const previousLesson = computed(() => lessonIndex.value > 0 ? lessons.value[lessonIndex.value - 1] : null)
const nextLesson = computed(() => lessonIndex.value >= 0 ? lessons.value[lessonIndex.value + 1] || null : null)
const selectedSection = computed(() => content.value?.sections.find((section) => section.lessons.some((lesson) => lesson.id === selected.value?.id)))
const asset = (url: string | null) => !url ? '' : url.startsWith('http') ? url : `${API_BASE_URL.replace('/api/v1', '')}${url}`
const lessonTypeLabel = (type: Lesson['lessonType']) => ({ TEXT: 'Bài đọc', VIDEO: 'Video', DOCUMENT: 'Tài liệu' }[type])
const docType = computed(() => {
  if (selected.value?.lessonType !== 'DOCUMENT' || !selected.value.documentUrl) return '';
  const url = selected.value.documentUrl.toLowerCase();
  if (url.endsWith('.pdf')) return 'pdf';
  if (url.endsWith('.pptx') || url.endsWith('.ppt')) return 'pptx';
  if (url.endsWith('.docx') || url.endsWith('.doc')) return 'docx';
  return '';
})

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
const renderedContent = computed(() => {
  if (!selected.value?.content) return ''
  // Escape HTML to prevent XSS
  let textVal = selected.value.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Replace custom image tag [image:url]
  textVal = textVal.replace(/\[image:(.+?)\]/g, (_, url) => {
    return `<img src="${asset(url)}" alt="Sơ đồ cây quyết định" class="my-6 max-w-full rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800" />`
  })

  return textVal
})

watch(() => selected.value?.id, () => void loadComments())
onMounted(load)
</script>

<template>
  <DefaultLayout>
    <div :class="['learning-shell', sidebarCollapsed ? 'sidebar-collapsed' : '']"> 
      <button v-if="sidebarOpen" class="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" aria-label="Đóng mục lục" @click="sidebarOpen = false" />
      <aside :class="['learning-sidebar', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', sidebarCollapsed ? 'sidebar-hidden' : '']">
        <button
          type="button"
          class="learning-sidebar-toggle hidden lg:grid"
          :aria-label="sidebarCollapsed ? 'Mở rộng mục lục' : 'Thu gọn mục lục'"
          :title="sidebarCollapsed ? 'Mở rộng mục lục' : 'Thu gọn mục lục'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <PanelLeftOpen v-if="sidebarCollapsed" :size="18" />
          <PanelLeftClose v-else :size="18" />
        </button>

        <div class="learning-sidebar-content">
          <div class="learning-course-summary">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <RouterLink to="/my-courses" class="sidebar-back-btn"><ArrowLeft :size="15" /><span>Khóa học của tôi</span></RouterLink>
                <h2 class="mt-3 line-clamp-2 text-lg font-black leading-snug">{{ content?.course.title }}</h2>
              </div>
              <button class="sidebar-mobile-close lg:hidden" aria-label="Đóng mục lục" @click="sidebarOpen = false"><X :size="20" /></button>
            </div>
            <div class="mt-5 flex justify-between text-xs font-semibold"><span>{{ progress?.completedLessons || 0 }}/{{ progress?.totalLessons || 0 }} bài</span><span>{{ Math.round(progress?.progressPercent || 0) }}%</span></div>
            <div class="learning-progress-track"><div class="learning-progress-value" :style="{ width: `${progress?.progressPercent || 0}%` }" /></div>
          </div>
          <nav class="flex-1 overflow-y-auto p-3" aria-label="Nội dung khóa học">
          <section v-for="(section, sectionIndex) in content?.sections" :key="section.id" class="mb-4">
            <p class="px-2 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Chương {{ sectionIndex + 1 }}</p>
            <h3 class="px-2 pb-2 text-sm font-bold text-slate-800 dark:text-slate-200">{{ section.title }}</h3>
            <button v-for="lesson in section.lessons" :key="lesson.id" :class="['lesson-link', selected?.id === lesson.id ? 'lesson-link--active' : '']" @click="chooseLesson(lesson)">
              <span :class="['lesson-state', lesson.progress?.isCompleted ? 'lesson-state--done' : '']"><Check v-if="lesson.progress?.isCompleted" :size="14" /><template v-else>{{ lesson.position }}</template></span>
              <span class="min-w-0 flex-1"><span class="line-clamp-2 font-semibold">{{ lesson.title }}</span><span class="mt-1 block text-[11px] opacity-65">{{ lessonTypeLabel(lesson.lessonType) }}<template v-if="lesson.durationSeconds"> · {{ Math.ceil(lesson.durationSeconds / 60) }} phút</template></span></span>
            </button>
          </section>

          <section class="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p class="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Tổng kết &amp; Đánh giá</p>
            <RouterLink
              :to="`/courses/${courseId}/assignments`"
              class="lesson-link flex items-center justify-between !border !border-amber-200/80 !bg-amber-50/70 !text-amber-800 hover:!bg-amber-100 dark:!border-amber-800/60 dark:!bg-amber-950/40 dark:!text-amber-200"
              title="Xem bài tập và điểm số"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="lesson-state !border-amber-300 !bg-amber-100 !text-amber-700 dark:!border-amber-800 dark:!bg-amber-900/60 dark:!text-amber-300"><ClipboardList :size="15" /></span>
                <span class="font-bold truncate">Bài tập &amp; điểm</span>
              </div>
              <ChevronRight :size="16" class="shrink-0 text-amber-600 dark:text-amber-400" />
            </RouterLink>
          </section>
          </nav>
        </div>
      </aside>

      <main class="min-w-0 flex-1">
        <header class="learning-topbar">
          <div class="flex items-center gap-3">
            <!-- Mobile: Nút quay lại và nút mở mục lục riêng biệt -->
            <RouterLink v-slot="{ navigate }" to="/my-courses" custom>
              <button class="back-btn inline-flex lg:hidden" title="Quay lại khóa học của tôi" @click="navigate">
                <ArrowLeft :size="18" />
              </button>
            </RouterLink>
            <button class="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700 lg:hidden" @click="sidebarOpen = true; sidebarCollapsed = false">
              <Menu :size="18" /> Mục lục
            </button>
            <RouterLink
              :to="`/courses/${courseId}/announcements`"
              class="inline-flex items-center gap-1.5 border border-purple-200 bg-purple-50/70 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 sm:text-sm dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
              title="Xem thông báo khóa học từ giảng viên"
            >
              <Megaphone :size="17" /> <span class="hidden sm:inline">Bảng tin thông báo</span><span class="sm:hidden">Thông báo</span>
            </RouterLink>
          </div>
          <p class="hidden min-w-0 text-sm text-slate-500 sm:block"><span class="font-semibold text-slate-700 dark:text-slate-300">{{ selectedSection?.title }}</span><span v-if="selected"> / {{ selected.title }}</span></p>
          <span v-if="selected" :class="['rounded-full px-3 py-1 text-xs font-bold', selected.progress?.isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300']">{{ selected.progress?.isCompleted ? 'Đã hoàn thành' : 'Đang học' }}</span>
        </header>
        <div class="learning-content">
          <LoadingSpinner v-if="api.loading.value && !content" class="py-24" />
          <p v-else-if="error" class="rounded-2xl bg-red-50 p-4 text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
          <template v-else-if="selected">
            <div class="mb-6"><p class="text-xs font-extrabold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400">{{ lessonTypeLabel(selected.lessonType) }} · Bài {{ lessonIndex + 1 }}/{{ lessons.length }}</p><h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{{ selected.title }}</h1></div>
            <section class="viewer-shell" :class="selected.lessonType === 'TEXT' ? 'viewer-shell--text' : ''">
              <article v-if="selected.lessonType === 'TEXT'" class="lesson-prose whitespace-pre-line" v-html="renderedContent" />
              <video v-else-if="selected.lessonType === 'VIDEO' && selected.videoUrl" :src="asset(selected.videoUrl)" controls class="max-h-[70vh] w-full bg-black" />
              <div v-else-if="selected.lessonType === 'DOCUMENT' && selected.documentUrl" class="h-[70vh] min-h-[520px] w-full overflow-hidden bg-white">
                <VueOfficePdf v-if="docType === 'pdf'" :src="asset(selected.documentUrl)" class="h-full w-full" />
                <VueOfficePptx v-else-if="docType === 'pptx'" :src="asset(selected.documentUrl)" class="h-full w-full" />
                <VueOfficeDocx v-else-if="docType === 'docx'" :src="asset(selected.documentUrl)" class="h-full w-full" />
                <iframe v-else :src="asset(selected.documentUrl)" class="h-full w-full" title="Tài liệu bài học" />
              </div>
              <div v-else class="grid min-h-72 place-items-center p-8 text-center"><div><FileText :size="42" class="mx-auto text-slate-400" /><p class="mt-3 font-bold">Nội dung đang được cập nhật</p><p class="mt-1 text-sm text-slate-500">Giảng viên chưa tải nội dung cho bài học này.</p></div></div>
            </section>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3"><BaseButton variant="secondary" :disabled="!previousLesson" @click="navigateLesson(previousLesson)"><ChevronLeft :size="17" /> Bài trước</BaseButton><div class="flex flex-wrap gap-2"><RouterLink v-slot="{ navigate }" v-if="selected.quiz" :to="{ path: `/quiz/${selected.quiz.id}`, query: { courseId } }" custom><BaseButton variant="outline" @click="navigate">Làm quiz</BaseButton></RouterLink><BaseButton @click="complete"><Check v-if="!selected.progress?.isCompleted" :size="17" />{{ selected.progress?.isCompleted ? 'Đánh dấu chưa xong' : 'Hoàn thành bài học' }}</BaseButton></div><BaseButton variant="secondary" :disabled="!nextLesson" @click="navigateLesson(nextLesson)">Bài tiếp <ChevronRight :size="17" /></BaseButton></div>

            <section class="discussion-panel surface-card mt-7 overflow-hidden">
              <header class="border-b border-slate-100 p-4 dark:border-slate-800"><div class="flex items-center justify-between gap-4"><div><h2 class="text-lg font-black">Thảo luận bài học</h2><p class="mt-0.5 text-xs text-slate-500">Đặt câu hỏi và trao đổi cùng cộng đồng.</p></div><span class="bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ comments.length }} chủ đề</span></div></header>
              <div class="p-4"><div v-if="replyTo" class="mb-3 flex items-center justify-between bg-purple-50 px-3 py-2 text-xs text-purple-700 dark:bg-purple-950/30 dark:text-purple-300"><span>Đang trả lời một bình luận</span><button class="font-bold" @click="replyTo = null">Hủy</button></div><textarea v-model="text" rows="2" class="comment-box" placeholder="Viết câu hỏi hoặc chia sẻ của bạn..." /><div class="mt-2 flex justify-end"><BaseButton size="sm" :disabled="!text.trim()" @click="send">Gửi bình luận</BaseButton></div></div>
              <div class="divide-y divide-slate-100 border-t border-slate-100 px-5 dark:divide-slate-800 dark:border-slate-800 sm:px-6">
                <article v-for="item in comments" :key="item.id" class="py-3"><div class="flex gap-2.5"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white">{{ item.user.fullName.charAt(0) }}</span><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><b class="text-sm">{{ item.user.fullName }}</b><span class="text-[11px] text-slate-400">{{ new Date(item.createdAt).toLocaleDateString('vi-VN') }}</span></div><p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ item.isDeleted ? 'Bình luận đã được xóa' : item.content }}</p><div v-if="!item.isDeleted" class="mt-1.5"><button class="text-xs font-bold text-purple-600" @click="replyTo = item.id">Trả lời</button><button v-if="item.user.id === auth.user?.id" class="ml-4 text-xs font-bold text-red-600" @click="remove(item.id)">Xóa</button></div><div v-for="reply in item.replies" :key="reply.id" class="mt-3 flex gap-2 bg-slate-50 p-3 dark:bg-slate-800/70"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-bold dark:bg-slate-700">{{ reply.user.fullName.charAt(0) }}</span><div><b class="text-xs">{{ reply.user.fullName }}</b><p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{{ reply.isDeleted ? 'Bình luận đã được xóa' : reply.content }}</p></div></div></div></div></article>
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
.learning-shell{display:flex;min-height:calc(100vh - 4.5rem)}
.learning-sidebar{position:fixed;inset:0 auto 0 0;z-index:40;display:flex;width:min(17rem,88vw);flex-direction:column;border-right:1px solid var(--border);background:var(--surface);padding-top:4.5rem;transition:transform .25s ease,width .3s ease}
.learning-sidebar-content{display:flex;min-height:0;flex:1;flex-direction:column;overflow:hidden;transition:opacity .2s ease}
.learning-course-summary{border-bottom:1px solid var(--border);padding:1.25rem}
.learning-progress-track{height:.375rem;overflow:hidden;background:var(--surface-muted);margin-top:.5rem}
.learning-progress-value{height:100%;background:linear-gradient(90deg,#7c3aed,#c026d3);transition:width .3s ease}
.learning-content{width:100%;padding:1.5rem .5rem}
.learning-topbar{position:sticky;top:4.5rem;z-index:20;display:flex;min-height:3.75rem;align-items:center;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--surface) 90%,transparent);padding:.75rem 1rem;backdrop-filter:blur(12px)}
.back-btn{align-items:center;gap:.5rem;padding:.5rem .85rem;border-radius:.625rem;font-size:.875rem;font-weight:700;color:var(--text-muted);border:1px solid var(--border);background:var(--surface);transition:all .2s ease;text-decoration:none;line-height:1}
.back-btn:hover{background:var(--surface-muted);color:var(--text);border-color:var(--text-muted)}
.sidebar-back-btn{display:inline-flex;align-items:center;gap:.4rem;font-size:.75rem;font-weight:800;color:var(--brand);transition:color .2s ease;text-decoration:none}
.sidebar-back-btn:hover{color:#6d28d9}
.sidebar-mobile-close{display:grid;height:2.25rem;width:2.25rem;flex-shrink:0;place-items:center;border:1px solid var(--border);color:var(--text-muted)}
.learning-sidebar-toggle{position:absolute;right:0;top:.75rem;z-index:20;height:3rem;width:1.75rem;place-items:center;border:1px solid var(--border);border-right:0;border-radius:999px 0 0 999px;background:var(--surface-muted);color:var(--text-muted);transition:color .2s ease,background .2s ease}
.learning-sidebar-toggle:hover{background:var(--brand-soft);color:var(--brand)}
.lesson-link{display:flex;width:100%;align-items:flex-start;gap:.7rem;border-left:3px solid transparent;padding:.7rem .65rem;text-align:left;color:var(--text-muted);transition:.18s}.lesson-link:hover{background:var(--surface-muted);color:var(--text)}.lesson-link--active{border-left-color:var(--brand);background:var(--brand-soft)!important;color:var(--brand)!important}.lesson-state{display:grid;width:1.65rem;height:1.65rem;flex-shrink:0;place-items:center;border:1px solid var(--border);font-size:.65rem;font-weight:800}.lesson-state--done{border-color:#10b981;background:#10b981;color:white}
.viewer-shell{min-height:clamp(32rem,68vh,54rem);overflow:hidden;border:1px solid var(--border);border-radius:1.35rem;background:var(--surface);box-shadow:var(--shadow-sm)}.viewer-shell--text{padding:1rem}.viewer-shell>video{min-height:clamp(32rem,68vh,54rem);object-fit:contain}.lesson-prose{margin:0;max-width:none;font-size:1.03rem;line-height:2;color:var(--text)}.discussion-panel{width:min(100%,48rem)}.comment-box{width:100%;resize:vertical;border:1px solid var(--border);border-radius:.5rem;background:var(--surface-muted);padding:.75rem;color:var(--text);outline:none}.comment-box:focus{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.1)}
@media(min-width:1024px){
  .learning-sidebar{position:sticky;top:4.5rem;z-index:10;height:calc(100vh - 4.5rem);width:17rem;min-width:17rem;padding-top:0;transition:width .3s ease,min-width .3s ease}
  .sidebar-collapsed .learning-sidebar.sidebar-hidden{width:5.25rem;min-width:5.25rem;overflow:hidden}
  .sidebar-collapsed .learning-sidebar-content{opacity:0;pointer-events:none}
  .sidebar-collapsed .learning-sidebar-toggle{right:0;color:var(--brand)}
  .learning-topbar{padding-inline:2rem}
}
</style>
