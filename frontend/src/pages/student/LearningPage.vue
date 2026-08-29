<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { API_BASE_URL, useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, Comment, CourseContent, CourseProgress, Lesson, LessonContent } from '@/types'
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
  LockKeyhole,
  ListChecks,
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
const enrollmentSucceeded = computed(() => route.query.enrolled === '1')
const lessons = computed(() => content.value?.sections.flatMap((section) => section.lessons) || [])
const lessonIndex = computed(() => lessons.value.findIndex((lesson) => lesson.id === selected.value?.id))
const previousLesson = computed(() => (lessonIndex.value > 0 ? lessons.value[lessonIndex.value - 1] : null))
const nextLesson = computed(() => (lessonIndex.value >= 0 ? lessons.value[lessonIndex.value + 1] || null : null))
const selectedSection = computed(() =>
  content.value?.sections.find((section) => section.lessons.some((lesson) => lesson.id === selected.value?.id)),
)
const asset = (url: string | null) =>
  !url ? '' : url.startsWith('http') ? url : `${API_BASE_URL.replace('/api/v1', '')}${url}`
const lessonTypeLabel = (type: Lesson['lessonType']) => ({ TEXT: 'Bài đọc', VIDEO: 'Video', DOCUMENT: 'Tài liệu' }[type])
const lessonBlocks = computed(() =>
  selected.value?.contents?.length
    ? selected.value.contents
    : selected.value
    ? [
        {
          id: `legacy-${selected.value.id}`,
          lessonId: selected.value.id,
          contentType: selected.value.lessonType,
          textContent: selected.value.content,
          fileUrl: selected.value.lessonType === 'VIDEO' ? selected.value.videoUrl : selected.value.documentUrl,
          originalName: null,
          mimeType: null,
          sizeBytes: null,
          position: 1,
          createdAt: '',
          updatedAt: '',
        },
      ]
    : [],
)
const docTypeFor = (url: string | null) => {
  const value = (url || '').toLowerCase()
  if (value.endsWith('.pdf')) return 'pdf'
  if (value.endsWith('.pptx') || value.endsWith('.ppt')) return 'pptx'
  if (value.endsWith('.docx') || value.endsWith('.doc')) return 'docx'
  return ''
}
const isImageBlock = (block: Pick<LessonContent, 'mimeType' | 'fileUrl'>) =>
  Boolean(block.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(block.fileUrl || ''))
const sectionQuizUnlocked = (section: CourseContent['sections'][number]) =>
  section.lessons.filter((lesson) => lesson.isPublished && lesson.isRequired).every((lesson) => lesson.progress?.isCompleted)

async function load() {
  try {
    const selectedId = selected.value?.id
    const [courseResponse, progressResponse] = await Promise.all([
      api.get<ApiResponse<CourseContent>>(`/courses/${courseId}/content`),
      api.get<ApiResponse<CourseProgress>>(`/courses/${courseId}/progress`),
    ])
    content.value = courseResponse.data || null
    progress.value = progressResponse.data || null
    selected.value = selectedId
      ? lessons.value.find((lesson) => lesson.id === selectedId) || lessons.value[0] || null
      : lessons.value.find((lesson) => !lesson.progress?.isCompleted) || lessons.value[0] || null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải nội dung khóa học'
  }
}

async function complete() {
  if (!selected.value) return
  await api.patch(`/lessons/${selected.value.id}/progress`, { isCompleted: !selected.value.progress?.isCompleted })
  await load()
}

function chooseLesson(lesson: Lesson) {
  selected.value = lesson
  sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function navigateLesson(lesson: Lesson | null) {
  if (lesson) chooseLesson(lesson)
}

async function loadComments() {
  if (!selected.value) return
  try {
    const response = await api.get<ApiResponse<Comment[]>>(`/lessons/${selected.value.id}/comments`)
    comments.value = response.data || []
  } catch {
    comments.value = []
  }
}

async function send() {
  if (!selected.value || !text.value.trim()) return
  await api.post(`/lessons/${selected.value.id}/comments`, { content: text.value.trim(), parentId: replyTo.value })
  text.value = ''
  replyTo.value = null
  await loadComments()
}

async function remove(id: string) {
  await api.del(`/comments/${id}`)
  await loadComments()
}

const renderText = (content: string | null) => {
  if (!content) return ''
  let textVal = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  textVal = textVal.replace(/\[image:(.+?)\]/g, (_, url) => {
    return `<img src="${asset(url)}" alt="Hình ảnh bài học" class="my-6 max-w-full border border-slate-200 shadow-sm dark:border-slate-800" />`
  })
  const inline = (value: string) => value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
  const rendered: string[] = []
  let inList = false
  textVal.split('\n').forEach((line) => {
    const heading = /^(#{1,5})\s+(.+)$/.exec(line.trim())
    const bullet = /^[-•]\s+(.+)$/.exec(line.trim())
    if (bullet) {
      if (!inList) {
        rendered.push('<ul>')
        inList = true
      }
      rendered.push(`<li>${inline(bullet[1]!)}</li>`)
      return
    }
    if (inList) {
      rendered.push('</ul>')
      inList = false
    }
    if (heading) {
      const level = heading[1]!.length
      rendered.push(`<h${level}>${inline(heading[2]!)}</h${level}>`)
      return
    }
    if (line.includes('<img ')) {
      rendered.push(line)
      return
    }
    rendered.push(line.trim() ? `<p>${inline(line)}</p>` : '<br>')
  })
  if (inList) rendered.push('</ul>')
  return rendered.join('')
}

watch(() => selected.value?.id, () => void loadComments())
onMounted(load)
</script>

<template>
  <DefaultLayout>
    <div :class="['learning-shell', sidebarCollapsed ? 'sidebar-collapsed' : '']">
      <!-- Backdrop for mobile sidebar -->
      <button
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
        aria-label="Đóng mục lục"
        @click="sidebarOpen = false"
      />

      <!-- Learning Sidebar (Sharp Flat Geometric) -->
      <aside :class="['learning-sidebar', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', sidebarCollapsed ? 'sidebar-hidden' : '']">
        <div class="learning-sidebar-content">
          <!-- Course Title & Progress Header -->
          <div class="learning-course-summary bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 p-4">
            <div class="flex items-center justify-between gap-3">
              <RouterLink to="/my-courses" class="sidebar-back-btn">
                <ArrowLeft :size="14" />
                <span>Khóa học của tôi</span>
              </RouterLink>

              <div class="flex items-center gap-1">
                <!-- Desktop Sidebar Collapse -->
                <button
                  type="button"
                  class="sidebar-collapse-btn hidden lg:grid"
                  title="Thu gọn mục lục"
                  aria-label="Thu gọn mục lục"
                  @click="sidebarCollapsed = true"
                >
                  <PanelLeftClose :size="16" />
                </button>
                <!-- Mobile Sidebar Close -->
                <button
                  type="button"
                  class="sidebar-mobile-close lg:hidden"
                  aria-label="Đóng mục lục"
                  @click="sidebarOpen = false"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>

            <h2 class="mt-2.5 line-clamp-2 text-sm font-black text-slate-950 dark:text-white leading-snug">
              {{ content?.course.title }}
            </h2>

            <div class="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>{{ progress?.completedLessons || 0 }}/{{ progress?.totalLessons || 0 }} bài học</span>
              <span class="text-purple-700 dark:text-purple-400">{{ Math.round(progress?.progressPercent || 0) }}%</span>
            </div>
            <div class="learning-progress-track mt-1.5 h-1.5 w-full bg-slate-200 dark:bg-slate-800">
              <div class="learning-progress-value h-full" :style="{ width: `${progress?.progressPercent || 0}%` }" />
            </div>
          </div>

          <!-- Section & Lesson Navigation -->
          <nav class="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Nội dung khóa học">
            <section v-for="(section, sectionIndex) in content?.sections" :key="section.id" class="space-y-1">
              <div class="px-2 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                <p class="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Chương {{ sectionIndex + 1 }}
                </p>
                <h3 class="text-xs font-bold text-slate-900 dark:text-slate-200 mt-0.5 leading-snug">
                  {{ section.title }}
                </h3>
              </div>

              <div class="space-y-0.5 pt-1">
                <button
                  v-for="lesson in section.lessons"
                  :key="lesson.id"
                  :class="['lesson-link', selected?.id === lesson.id ? 'lesson-link--active' : '']"
                  @click="chooseLesson(lesson)"
                >
                  <span :class="['lesson-state', lesson.progress?.isCompleted ? 'lesson-state--done' : '']">
                    <Check v-if="lesson.progress?.isCompleted" :size="13" :stroke-width="3" />
                    <template v-else>{{ lesson.position }}</template>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="line-clamp-2 text-xs font-bold leading-snug">{{ lesson.title }}</span>
                    <span class="mt-0.5 block text-[10px] opacity-70">
                      {{ lessonTypeLabel(lesson.lessonType) }}
                      <template v-if="lesson.durationSeconds"> · {{ Math.ceil(lesson.durationSeconds / 60) }}p</template>
                    </span>
                  </span>
                </button>

                <!-- Section Quiz Link -->
                <RouterLink
                  v-if="section.quiz && sectionQuizUnlocked(section)"
                  :to="{ path: `/quiz/${section.quiz.id}`, query: { courseId } }"
                  class="section-quiz-link"
                >
                  <span class="lesson-state section-quiz-state"><ListChecks :size="13" /></span>
                  <span class="min-w-0 flex-1">
                    <b class="block text-xs">Quiz kiểm tra</b>
                    <small class="truncate block">{{ section.quiz.title }}</small>
                  </span>
                  <ChevronRight :size="14" />
                </RouterLink>

                <div v-else-if="section.quiz" class="section-quiz-link section-quiz-link--locked">
                  <span class="lesson-state"><LockKeyhole :size="12" /></span>
                  <span class="min-w-0 flex-1">
                    <b class="block text-xs">Quiz kiểm tra</b>
                    <small class="truncate block">Hoàn thành bài bắt buộc để mở</small>
                  </span>
                </div>
              </div>
            </section>

            <!-- Assignments Link -->
            <section class="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
              <RouterLink
                :to="`/courses/${courseId}/assignments`"
                class="lesson-link flex items-center justify-between !border !border-amber-300 !bg-amber-50/80 !text-amber-900 hover:!bg-amber-100 dark:!border-amber-800 dark:!bg-amber-950/40 dark:!text-amber-200"
                title="Xem bài tập và điểm số"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="lesson-state !border-amber-400 !bg-amber-200 !text-amber-800 dark:!border-amber-800 dark:!bg-amber-900/60 dark:!text-amber-300">
                    <ClipboardList :size="14" />
                  </span>
                  <span class="text-xs font-bold truncate">Bài tập &amp; Điểm</span>
                </div>
                <ChevronRight :size="15" class="shrink-0 text-amber-700" />
              </RouterLink>
            </section>
          </nav>
        </div>
      </aside>

      <!-- Main Learning Content Canvas -->
      <main class="min-w-0 flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col">
        <!-- Top Toolbar -->
        <header class="learning-topbar border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center gap-3">
            <!-- Reopen sidebar button -->
            <button
              v-if="sidebarCollapsed"
              type="button"
              class="hidden lg:inline-flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:border-purple-400 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Mở rộng mục lục"
              @click="sidebarCollapsed = false"
            >
              <PanelLeftOpen :size="15" />
              <span>Mục lục</span>
            </button>

            <!-- Mobile menu trigger -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-slate-300 px-3 py-1.5 text-xs font-bold lg:hidden dark:border-slate-700"
              @click="sidebarOpen = true; sidebarCollapsed = false"
            >
              <Menu :size="15" />
              <span>Mục lục</span>
            </button>

            <!-- Course Announcements -->
            <RouterLink
              :to="`/courses/${courseId}/announcements`"
              class="inline-flex items-center gap-1.5 border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
            >
              <Megaphone :size="14" />
              <span class="hidden sm:inline">Bảng tin thông báo</span>
              <span class="sm:hidden">Thông báo</span>
            </RouterLink>
          </div>

          <!-- Breadcrumb & Status Tag -->
          <div class="flex items-center gap-4">
            <p class="hidden text-xs text-slate-500 sm:block">
              <span class="font-bold text-slate-700 dark:text-slate-300">{{ selectedSection?.title }}</span>
              <span v-if="selected" class="text-slate-400"> / </span>
              <span v-if="selected" class="font-medium text-slate-600 dark:text-slate-400">{{ selected.title }}</span>
            </p>

            <span
              v-if="selected"
              class="inline-block border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              :class="[
                selected.progress?.isCompleted
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
              ]"
            >
              {{ selected.progress?.isCompleted ? 'Đã hoàn thành' : 'Đang học' }}
            </span>
          </div>
        </header>

        <!-- Main Body Stream -->
        <div class="learning-content max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          <!-- Enrollment notification if just registered -->
          <div
            v-if="enrollmentSucceeded"
            class="flex items-center gap-3 border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            role="status"
          >
            <span class="grid h-6 w-6 shrink-0 place-items-center bg-emerald-600 text-white">
              <Check :size="14" />
            </span>
            <span>Đăng ký khóa học thành công. Chúc bạn có trải nghiệm học tập tuyệt vời!</span>
          </div>

          <LoadingSpinner v-if="api.loading.value && !content" class="py-24" />
          <p v-else-if="error" class="border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">{{ error }}</p>

          <template v-else-if="selected">
            <!-- Article Canvas Box (Sharp Flat Minimalist) -->
            <article class="border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <!-- Lesson Header -->
              <div class="border-b border-slate-100 pb-5 dark:border-slate-800">
                <p class="text-[11px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">
                  {{ lessonTypeLabel(selected.lessonType) }} · Bài {{ lessonIndex + 1 }}/{{ lessons.length }}
                </p>
                <h1 class="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                  {{ selected.title }}
                </h1>
              </div>

              <!-- Lesson Content Stream -->
              <section class="lesson-content-stream">
                <template v-for="block in lessonBlocks" :key="block.id">
                  <div
                    v-if="block.contentType === 'TEXT'"
                    class="lesson-flow-item lesson-prose text-slate-800 dark:text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-line"
                    v-html="renderText(block.textContent)"
                  />
                  <video
                    v-else-if="block.contentType === 'VIDEO' && block.fileUrl"
                    :src="asset(block.fileUrl)"
                    controls
                    class="lesson-flow-item lesson-video-viewer"
                  />
                  <div
                    v-else-if="isImageBlock(block) && block.fileUrl"
                    class="lesson-flow-item lesson-image-viewer"
                  >
                    <img :src="asset(block.fileUrl)" :alt="block.originalName || 'Hình ảnh bài học'" class="border border-slate-200 dark:border-slate-800" />
                  </div>
                  <div
                    v-else-if="block.contentType === 'DOCUMENT' && block.fileUrl"
                    class="lesson-flow-item lesson-document-viewer w-full overflow-hidden bg-white border border-slate-200 dark:border-slate-800"
                  >
                    <VueOfficePdf v-if="docTypeFor(block.fileUrl) === 'pdf'" :src="asset(block.fileUrl)" class="h-full w-full" />
                    <VueOfficePptx v-else-if="docTypeFor(block.fileUrl) === 'pptx'" :src="asset(block.fileUrl)" class="h-full w-full" />
                    <VueOfficeDocx v-else-if="docTypeFor(block.fileUrl) === 'docx'" :src="asset(block.fileUrl)" class="h-full w-full" />
                    <iframe v-else :src="asset(block.fileUrl)" class="h-full w-full" title="Tài liệu bài học" />
                  </div>
                  <div v-else class="lesson-flow-item grid min-h-48 place-items-center text-center">
                    <div>
                      <FileText :size="36" class="mx-auto text-slate-400" />
                      <p class="mt-2 text-xs font-bold text-slate-500">Nội dung đang được cập nhật</p>
                    </div>
                  </div>
                </template>

                <div v-if="!lessonBlocks.length" class="grid min-h-60 place-items-center text-center">
                  <div>
                    <FileText :size="36" class="mx-auto text-slate-400" />
                    <p class="mt-2 text-xs font-bold text-slate-500">Nội dung đang được cập nhật</p>
                  </div>
                </div>
              </section>

              <!-- Lesson Completion & Navigation Toolbar -->
              <div class="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  :disabled="!previousLesson"
                  class="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  @click="navigateLesson(previousLesson)"
                >
                  <ChevronLeft :size="16" />
                  <span>Bài trước</span>
                </button>

                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink
                    v-if="selected.quiz"
                    :to="{ path: `/quiz/${selected.quiz.id}`, query: { courseId } }"
                    class="inline-flex items-center gap-1.5 border border-violet-600 bg-white px-4 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:bg-slate-800 dark:text-violet-300"
                  >
                    <span>Làm bài Quiz</span>
                  </RouterLink>

                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:translate-y-px"
                    :class="[
                      selected.progress?.isCompleted
                        ? 'bg-slate-700 hover:bg-slate-800'
                        : 'bg-gradient-to-r from-violet-700 to-purple-700 hover:from-violet-800 hover:to-purple-800',
                    ]"
                    @click="complete"
                  >
                    <Check v-if="!selected.progress?.isCompleted" :size="15" />
                    <span>{{ selected.progress?.isCompleted ? 'Đánh dấu chưa xong' : 'Hoàn thành bài học' }}</span>
                  </button>
                </div>

                <button
                  type="button"
                  :disabled="!nextLesson"
                  class="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  @click="navigateLesson(nextLesson)"
                >
                  <span>Bài tiếp theo</span>
                  <ChevronRight :size="16" />
                </button>
              </div>
            </article>

            <!-- Discussion & Q&A Panel (Sharp Flat Geometric) -->
            <section class="border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <header class="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 class="text-sm font-black text-slate-950 dark:text-white">Thảo luận bài học</h2>
                  <p class="text-[11px] text-slate-500 mt-0.5">Đặt câu hỏi và trao đổi cùng giảng viên &amp; cộng đồng</p>
                </div>
                <span class="border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {{ comments.length }} bình luận
                </span>
              </header>

              <!-- New Comment Input -->
              <div class="p-4 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                <div v-if="replyTo" class="mb-2 flex items-center justify-between border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                  <span>Đang trả lời một bình luận</span>
                  <button class="font-bold hover:underline" @click="replyTo = null">Hủy</button>
                </div>
                <textarea
                  v-model="text"
                  rows="2"
                  class="comment-box border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Viết câu hỏi hoặc chia sẻ cảm nhận của bạn về bài học..."
                />
                <div class="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    class="bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 disabled:opacity-50 transition"
                    :disabled="!text.trim()"
                    @click="send"
                  >
                    Gửi thảo luận
                  </button>
                </div>
              </div>

              <!-- Comments List -->
              <div class="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
                <article v-for="item in comments" :key="item.id" class="pt-3 first:pt-0 space-y-2">
                  <div class="flex items-start gap-3">
                    <span class="grid h-7 w-7 shrink-0 place-items-center bg-violet-700 text-xs font-black text-white">
                      {{ item.user.fullName.charAt(0) }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <b class="text-xs font-bold text-slate-900 dark:text-white">{{ item.user.fullName }}</b>
                        <span class="text-[10px] text-slate-400">{{ new Date(item.createdAt).toLocaleDateString('vi-VN') }}</span>
                      </div>
                      <p class="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {{ item.isDeleted ? 'Bình luận đã được xóa' : item.content }}
                      </p>
                      <div v-if="!item.isDeleted" class="mt-1.5 flex items-center gap-3 text-[11px]">
                        <button class="font-bold text-purple-700 hover:underline dark:text-purple-400" @click="replyTo = item.id">
                          Trả lời
                        </button>
                        <button
                          v-if="item.user.id === auth.user?.id"
                          class="font-bold text-red-600 hover:underline"
                          @click="remove(item.id)"
                        >
                          Xóa
                        </button>
                      </div>

                      <!-- Replies -->
                      <div v-if="item.replies?.length" class="mt-3 space-y-2 border-l-2 border-purple-200 pl-3 dark:border-purple-900/60">
                        <div v-for="reply in item.replies" :key="reply.id" class="bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div class="flex items-center gap-2">
                            <span class="grid h-5 w-5 shrink-0 place-items-center bg-slate-300 text-[10px] font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                              {{ reply.user.fullName.charAt(0) }}
                            </span>
                            <b class="text-[11px] text-slate-900 dark:text-white">{{ reply.user.fullName }}</b>
                          </div>
                          <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {{ reply.isDeleted ? 'Bình luận đã được xóa' : reply.content }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                <p v-if="!comments.length" class="py-8 text-center text-xs text-slate-500 font-medium">
                  Chưa có thảo luận nào. Hãy là người đầu tiên đặt câu hỏi!
                </p>
              </div>
            </section>
          </template>

          <section v-else-if="content" class="border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Khóa học chưa có bài học được xuất bản.
          </section>
        </div>
      </main>
    </div>
  </DefaultLayout>
</template>

<style scoped>
/* Strictly No Rounded Corners - Flat Geometric Layout */
.learning-shell {
  display: flex;
  min-height: calc(100vh - 4.5rem);
}

.learning-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  display: flex;
  width: min(18rem, 88vw);
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--surface);
  padding-top: 4.5rem;
  transition: transform 0.25s ease, width 0.25s ease;
}

.learning-sidebar-content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.learning-course-summary {
  border-bottom: 1px solid var(--border);
}

.learning-progress-track {
  overflow: hidden;
  background: var(--surface-muted);
}

.learning-progress-value {
  background: linear-gradient(90deg, #7c3aed, #c026d3);
  transition: width 0.3s ease;
}

.learning-topbar {
  position: sticky;
  top: 4.5rem;
  z-index: 20;
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sidebar-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--brand);
  text-decoration: none;
}
.sidebar-back-btn:hover {
  color: #6d28d9;
}

.sidebar-mobile-close {
  display: grid;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
}

.sidebar-collapse-btn {
  display: none;
}

.lesson-link {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 0.6rem;
  border-left: 2px solid transparent;
  padding: 0.55rem 0.5rem;
  text-align: left;
  color: var(--text-muted);
  transition: 0.15s;
}
.lesson-link:hover {
  background: var(--surface-muted);
  color: var(--text);
}
.lesson-link--active {
  border-left-color: var(--brand);
  background: var(--brand-soft) !important;
  color: var(--brand) !important;
}

.lesson-state {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--border);
  font-size: 0.65rem;
  font-weight: 800;
}
.lesson-state--done {
  border-color: #10b981;
  background: #10b981;
  color: white;
}

.section-quiz-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.35rem;
  border: 1px solid #fcd34d;
  background: #fffbeb;
  padding: 0.55rem 0.6rem;
  color: #92400e;
}
.section-quiz-link:hover {
  background: #fef3c7;
}
.section-quiz-link small {
  display: block;
  font-size: 0.65rem;
  opacity: 0.75;
}
.section-quiz-state {
  border-color: #f59e0b;
  background: #f59e0b;
  color: white;
}
.section-quiz-link--locked {
  cursor: not-allowed;
  border-color: var(--border);
  background: var(--surface-muted);
  color: var(--text-muted);
  opacity: 0.78;
}

.lesson-video-viewer {
  display: block;
  max-height: 70vh;
  min-height: 20rem;
  width: 100%;
  background: #000;
  object-fit: contain;
}

.lesson-image-viewer {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.lesson-image-viewer img {
  display: block;
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
}

.lesson-document-viewer {
  height: min(68vh, 44rem);
  min-height: 24rem;
}

.lesson-prose {
  margin: 0;
  max-width: none;
  color: var(--text);
  font-size: 1rem;
  line-height: 1.85;
}
.lesson-prose :deep(h1) {
  margin: 1.4rem 0 0.7rem;
  font-size: 1.75rem;
  line-height: 1.25;
  font-weight: 900;
}
.lesson-prose :deep(h2) {
  margin: 1.25rem 0 0.6rem;
  font-size: 1.45rem;
  line-height: 1.3;
  font-weight: 850;
}
.lesson-prose :deep(h3) {
  margin: 1.1rem 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1.35;
  font-weight: 800;
}
.lesson-prose :deep(p) {
  margin: 0.6rem 0;
  font-size: 0.95rem;
  line-height: 1.85;
}
.lesson-prose :deep(ul) {
  margin: 0.6rem 0;
  padding-left: 1.5rem;
  list-style: disc;
}
.lesson-prose :deep(li) {
  margin: 0.35rem 0;
  line-height: 1.75;
}
.lesson-prose :deep(strong) {
  font-weight: 800;
}

.comment-box {
  width: 100%;
  resize: vertical;
}

@media (min-width: 1024px) {
  .sidebar-mobile-close {
    display: none !important;
  }
  .sidebar-collapse-btn {
    display: grid;
    height: 1.75rem;
    width: 1.75rem;
    flex-shrink: 0;
    place-items: center;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    transition: all 0.2s ease;
  }
  .sidebar-collapse-btn:hover {
    background: var(--brand-soft);
    color: var(--brand);
    border-color: var(--brand);
  }
  .learning-sidebar {
    position: sticky;
    top: 4.5rem;
    z-index: 10;
    height: calc(100vh - 4.5rem);
    width: 18rem;
    min-width: 18rem;
    padding-top: 0;
  }
  .sidebar-collapsed .learning-sidebar {
    width: 0 !important;
    min-width: 0 !important;
    overflow: hidden;
    border-right: none;
    visibility: hidden;
  }
  .sidebar-collapsed .learning-sidebar-content {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
