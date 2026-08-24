<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { API_BASE_URL, useApi } from '@/composables/useApi'
import type { ApiResponse, CourseSection, Lesson, LessonContent } from '@/types'
import VueOfficePdf from '@vue-office/pdf'
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'
import VueOfficePptx from '@vue-office/pptx'

type LessonType = 'VIDEO' | 'TEXT' | 'DOCUMENT'
const route = useRoute()
const api = useApi()
const courseId = String(route.params.courseId)
const sections = ref<CourseSection[]>([])
const message = ref('')
const error = ref('')
const sectionModalOpen = ref(false)
const sectionSaving = ref(false)
const editingSection = ref<CourseSection | null>(null)
const sectionTitle = ref('')
const lessonModalOpen = ref(false)
const lessonSaving = ref(false)
const editingLesson = ref<Lesson | null>(null)
const targetSection = ref<CourseSection | null>(null)
const lessonFile = ref<File | null>(null)
const fileInputKey = ref(0)
const deleteTarget = ref<{ kind: 'section' | 'lesson'; id: string; title: string } | null>(null)
const deleting = ref(false)
const contentModalOpen = ref(false)
const contentLesson = ref<Lesson | null>(null)
const activeLesson = ref<Lesson | null>(null)
const contentBlocks = ref<LessonContent[]>([])
const contentLoading = ref(false)
const contentSaving = ref(false)
const newContentType = ref<LessonType>('TEXT')
const newContentText = ref('')
const newContentFile = ref<File | null>(null)
const contentFileKey = ref(0)

const lessonForm = reactive({ title: '', lessonType: 'TEXT' as LessonType, content: '', isPreview: false, isRequired: true })
const totalLessons = computed(() => sections.value.reduce((total, section) => total + section.lessons.length, 0))
const publishedLessons = computed(() => sections.value.flatMap((section) => section.lessons).filter((lesson) => lesson.isPublished).length)
const acceptedLessonFiles = computed(() => lessonForm.lessonType === 'VIDEO' ? 'video/mp4,video/webm' : '.pdf,.doc,.docx,.ppt,.pptx,application/pdf')
const currentLessonFileUrl = computed(() => !editingLesson.value ? null : editingLesson.value.lessonType === 'VIDEO' ? editingLesson.value.videoUrl : editingLesson.value.documentUrl)
const lessonTypeLabel = (type: LessonType) => ({ TEXT: 'Văn bản', VIDEO: 'Video', DOCUMENT: 'Tài liệu' }[type])
const formatBytes = (bytes: number | null) => !bytes ? '' : bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const renderDocumentText = (value: string | null) => (value || '').split('\n').map(line => {
  const heading = /^(#{1,5})\s+(.+)$/.exec(line.trim())
  if (heading) { const level = heading[1]!.length; return `<h${level}>${escapeHtml(heading[2]!)}</h${level}>` }
  return line.trim() ? `<p>${escapeHtml(line)}</p>` : '<br>'
}).join('')
function insertHeading(level: number) { const prefix = `${'#'.repeat(level)} `; newContentText.value = newContentText.value ? `${newContentText.value}\n${prefix}` : prefix }

const asset = (url: string | null) => !url ? '' : url.startsWith('http') ? url : `${API_BASE_URL.replace('/api/v1', '')}${url}`

const previewSrc = computed(() => {
  if (lessonFile.value) return lessonFile.value
  if (editingLesson.value && editingLesson.value.lessonType === lessonForm.lessonType) {
    const url = editingLesson.value.lessonType === 'VIDEO' ? editingLesson.value.videoUrl : editingLesson.value.documentUrl
    return url ? asset(url) : null
  }
  return null
})

const previewType = computed(() => {
  if (lessonForm.lessonType !== 'DOCUMENT') return ''
  let name = ''
  if (lessonFile.value) {
    name = lessonFile.value.name.toLowerCase()
  } else if (editingLesson.value?.documentUrl) {
    name = editingLesson.value.documentUrl.toLowerCase()
  }
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'pptx'
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx'
  return ''
})

watch(() => lessonForm.lessonType, () => { lessonFile.value = null; fileInputKey.value += 1 })

async function load() {
  try {
    const response = await api.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`); sections.value = response.data || []
    const previousId = activeLesson.value?.id
    activeLesson.value = sections.value.flatMap(section => section.lessons).find(lesson => lesson.id === previousId) || sections.value[0]?.lessons[0] || null
    if (activeLesson.value) await selectLesson(activeLesson.value)
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không tải được nội dung khóa học' }
}

function openCreateSection() { editingSection.value = null; sectionTitle.value = ''; error.value = ''; sectionModalOpen.value = true }
function openEditSection(section: CourseSection) { editingSection.value = section; sectionTitle.value = section.title; error.value = ''; sectionModalOpen.value = true }
function closeSectionModal() { if (!sectionSaving.value) sectionModalOpen.value = false }
async function saveSection() {
  if (!sectionTitle.value.trim()) { error.value = 'Vui lòng nhập tên chương'; return }
  sectionSaving.value = true; error.value = ''
  try {
    if (editingSection.value) await api.patch(`/sections/${editingSection.value.id}`, { title: sectionTitle.value.trim() })
    else await api.post(`/courses/${courseId}/sections`, { title: sectionTitle.value.trim(), position: sections.value.length + 1 })
    message.value = editingSection.value ? 'Đã cập nhật chương.' : 'Đã thêm chương mới.'
    sectionModalOpen.value = false
    await load()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể lưu chương' }
  finally { sectionSaving.value = false }
}

function askDeleteSection(section: CourseSection) { deleteTarget.value = { kind: 'section', id: section.id, title: section.title } }
function askDeleteLesson(lesson: Lesson) { deleteTarget.value = { kind: 'lesson', id: lesson.id, title: lesson.title } }
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true; error.value = ''
  try {
    await api.del(deleteTarget.value.kind === 'section' ? `/sections/${deleteTarget.value.id}` : `/lessons/${deleteTarget.value.id}`)
    message.value = deleteTarget.value.kind === 'section' ? 'Đã xóa chương và các bài học liên quan.' : 'Đã xóa bài học.'
    deleteTarget.value = null
    await load()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể xóa nội dung' }
  finally { deleting.value = false }
}

function resetLessonForm() { lessonForm.title = ''; lessonForm.lessonType = 'TEXT'; lessonForm.content = ''; lessonForm.isPreview = false; lessonForm.isRequired = true; lessonFile.value = null; fileInputKey.value += 1 }
function openCreateLesson(section: CourseSection) { editingLesson.value = null; targetSection.value = section; resetLessonForm(); error.value = ''; lessonModalOpen.value = true }
function openEditLesson(lesson: Lesson) {
  editingLesson.value = lesson; targetSection.value = sections.value.find((section) => section.id === lesson.sectionId) || null
  lessonForm.title = lesson.title; lessonForm.lessonType = lesson.lessonType; lessonForm.content = lesson.content || ''; lessonForm.isPreview = lesson.isPreview; lessonForm.isRequired = lesson.isRequired
  lessonFile.value = null; fileInputKey.value += 1; error.value = ''; lessonModalOpen.value = true
}
function closeLessonModal() { if (lessonSaving.value) return; lessonModalOpen.value = false; editingLesson.value = null; targetSection.value = null; resetLessonForm() }
function selectLessonFile(event: Event) {
  const element = event.target as HTMLInputElement
  const file = element.files?.[0] || null
  error.value = ''
  if (!file) { lessonFile.value = null; return }
  const allowed = lessonForm.lessonType === 'VIDEO' ? ['video/mp4', 'video/webm'] : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  if (!allowed.includes(file.type)) { element.value = ''; error.value = lessonForm.lessonType === 'VIDEO' ? 'Video phải có định dạng MP4 hoặc WebM' : 'Tài liệu phải có định dạng PDF, DOC, DOCX, PPT hoặc PPTX'; return }
  if (file.size > 100 * 1024 * 1024) { element.value = ''; error.value = 'File bài học không được vượt quá 100 MB'; return }
  lessonFile.value = file
}

async function saveLesson() {
  error.value = ''; message.value = ''
  if (!lessonForm.title.trim()) { error.value = 'Vui lòng nhập tên bài học'; return }
  lessonSaving.value = true
  try {
    const payload = editingLesson.value
      ? { title: lessonForm.title.trim(), isPreview: lessonForm.isPreview, isRequired: lessonForm.isRequired }
      : { title: lessonForm.title.trim(), lessonType: 'TEXT' as const, content: null, isPreview: lessonForm.isPreview, isRequired: lessonForm.isRequired }
    let lessonId = editingLesson.value?.id
    if (lessonId) await api.patch(`/lessons/${lessonId}`, payload)
    else {
      if (!targetSection.value) throw new Error('Không xác định được chương của bài học')
      const response = await api.post<ApiResponse<Lesson>>(`/sections/${targetSection.value.id}/lessons`, { ...payload, position: targetSection.value.lessons.length + 1, isPublished: false })
      if (!response.data) throw new Error('Không nhận được thông tin bài học vừa tạo')
      lessonId = response.data.id
    }
    message.value = editingLesson.value ? 'Đã lưu thông tin bài học.' : 'Đã tạo bài học. Nhấn “Thêm nội dung” để xây dựng bài.'
    await load()
    lessonModalOpen.value = false
    editingLesson.value = null
    targetSection.value = null
    resetLessonForm()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể lưu bài học'; await load() }
  finally { lessonSaving.value = false }
}

async function toggleLesson(lesson: Lesson) {
  try { await api.patch(`/lessons/${lesson.id}`, { isPublished: !lesson.isPublished }); message.value = lesson.isPublished ? 'Đã chuyển bài học về bản nháp.' : 'Đã xuất bản bài học.'; await load() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể đổi trạng thái bài học' }
}
async function openContentManager(lesson: Lesson) {
  await selectLesson(lesson); contentLesson.value = lesson; contentModalOpen.value = true; error.value = ''
}
async function selectLesson(lesson: Lesson) {
  activeLesson.value = lesson; contentLesson.value = lesson; contentLoading.value = true; error.value = ''
  newContentType.value = 'TEXT'; newContentText.value = ''; newContentFile.value = null; contentFileKey.value += 1
  try { const response = await api.get<ApiResponse<LessonContent[]>>(`/lessons/${lesson.id}/contents`); contentBlocks.value = response.data || [] }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể tải nội dung bài học' }
  finally { contentLoading.value = false }
}
function closeContentManager() { if (contentSaving.value) return; contentModalOpen.value = false }
function selectContentFile(event: Event) { newContentFile.value = (event.target as HTMLInputElement).files?.[0] || null }
async function addContentBlock() {
  if (!contentLesson.value) return
  if (newContentType.value === 'TEXT' && !newContentText.value.trim()) { error.value = 'Vui lòng nhập nội dung văn bản'; return }
  if (newContentType.value !== 'TEXT' && !newContentFile.value) { error.value = 'Vui lòng chọn file nội dung'; return }
  contentSaving.value = true; error.value = ''
  try {
    const response = await api.post<ApiResponse<LessonContent>>(`/lessons/${contentLesson.value.id}/contents`, { contentType: newContentType.value, textContent: newContentType.value === 'TEXT' ? newContentText.value.trim() : null })
    if (!response.data) throw new Error('Không nhận được nội dung vừa tạo')
    if (newContentFile.value) { const body = new FormData(); body.append('file', newContentFile.value); await api.post(`/lesson-contents/${response.data.id}/file`, body) }
    const refreshed = await api.get<ApiResponse<LessonContent[]>>(`/lessons/${contentLesson.value.id}/contents`); contentBlocks.value = refreshed.data || []
    newContentText.value = ''; newContentFile.value = null; contentFileKey.value += 1; message.value = 'Đã thêm nội dung vào bài học.'
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể thêm nội dung' }
  finally { contentSaving.value = false }
}
async function moveContent(index: number, direction: -1 | 1) {
  if (!contentLesson.value) return; const next = index + direction; if (next < 0 || next >= contentBlocks.value.length) return
  const ordered = [...contentBlocks.value]; [ordered[index], ordered[next]] = [ordered[next]!, ordered[index]!]
  try { const response = await api.patch<ApiResponse<LessonContent[]>>(`/lessons/${contentLesson.value.id}/contents/reorder`, { contentIds: ordered.map(item => item.id) }); contentBlocks.value = response.data || ordered }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể đổi thứ tự nội dung' }
}
async function removeContentBlock(item: LessonContent) {
  if (!confirm('Xóa nội dung này khỏi bài học?')) return
  try { await api.del(`/lesson-contents/${item.id}`); contentBlocks.value = contentBlocks.value.filter(block => block.id !== item.id); message.value = 'Đã xóa nội dung.' }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể xóa nội dung' }
}
onMounted(load)
</script>

<template>
  <InstructorLayout>
    <main class="app-page max-w-none">
      <header><RouterLink to="/instructor/courses" class="text-sm font-bold text-purple-600 dark:text-purple-400">← Khóa học của tôi</RouterLink><h1 class="app-page-title mt-3">Xây dựng nội dung khóa học</h1><p class="app-page-description">Xây dựng theo từng chương, bài học và các khối nội dung giống một tài liệu Notion.</p></header>

      <section class="mt-8 grid gap-4 sm:grid-cols-3"><article class="builder-metric"><span>Tổng chương</span><b>{{ sections.length }}</b></article><article class="builder-metric"><span>Tổng bài học</span><b>{{ totalLessons }}</b></article><article class="builder-metric"><span>Đã xuất bản</span><b>{{ publishedLessons }}/{{ totalLessons }}</b></article></section>
      <p v-if="error" class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
      <p v-if="message" class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{{ message }}</p>
      <div v-if="api.loading.value && !sections.length" class="surface-card mt-6 py-16 text-center text-slate-500">Đang tải nội dung...</div>
      <section v-else-if="!sections.length" class="surface-card mt-6 grid min-h-80 place-items-center border-dashed p-8 text-center"><div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl text-purple-600 dark:bg-purple-950/40">＋</span><h2 class="mt-5 text-xl font-extrabold">Bắt đầu với chương đầu tiên</h2><p class="mt-2 max-w-md text-sm leading-6 text-slate-500">Chia khóa học thành các chương nhỏ, sau đó thêm video, bài đọc, tài liệu và quiz.</p><BaseButton class="mt-5" @click="openCreateSection">Thêm chương</BaseButton></div></section>

      <div v-else class="builder-docs-layout mt-6">
        <aside class="builder-outline">
        <section v-for="(section, sectionIndex) in sections" :key="section.id" class="outline-section">
          <header class="notion-section-header"><span class="section-index">{{ String(sectionIndex + 1).padStart(2, '0') }}</span><div class="min-w-48 flex-1"><h2 class="font-extrabold">{{ section.title }}</h2><p class="mt-1 text-xs text-slate-500">{{ section.lessons.length }} bài học · Quiz ở cuối chương</p></div><div class="flex flex-wrap items-center gap-1"><BaseButton size="sm" variant="ghost" @click="openEditSection(section)">Sửa</BaseButton><BaseButton size="sm" variant="ghost" @click="askDeleteSection(section)">Xóa</BaseButton></div></header>
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <article v-for="lesson in section.lessons" :key="lesson.id" :class="['lesson-row', activeLesson?.id === lesson.id ? 'lesson-row--active' : '']" @click="selectLesson(lesson)">
              <span :class="['lesson-kind', `lesson-kind--${lesson.lessonType.toLowerCase()}`]">{{ lessonTypeLabel(lesson.lessonType) }}</span>
              <div class="min-w-44 flex-1"><div class="flex flex-wrap items-center gap-2"><h3 class="font-bold">{{ lesson.position }}. {{ lesson.title }}</h3><span v-if="lesson.isPreview" class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Học thử</span></div><p :class="['mt-1 text-xs font-medium', lesson.isPublished ? 'text-emerald-600' : 'text-amber-600']">{{ lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp' }}</p></div>
              <div class="flex flex-wrap items-center justify-end gap-1"><button class="notion-add-content" type="button" @click="openContentManager(lesson)">＋ <span>Thêm nội dung</span><small>{{ lesson.contents?.length || 0 }}</small></button><BaseButton size="sm" variant="ghost" @click="openEditLesson(lesson)">Sửa</BaseButton><BaseButton size="sm" variant="ghost" @click="toggleLesson(lesson)">{{ lesson.isPublished ? 'Ẩn' : 'Xuất bản' }}</BaseButton><BaseButton size="sm" variant="ghost" @click="askDeleteLesson(lesson)">Xóa</BaseButton></div>
            </article>
            <div v-if="!section.lessons.length" class="px-5 py-4 text-sm text-slate-500">Chương này chưa có bài học.</div>
            <div class="section-footer-actions">
              <button class="notion-insert" type="button" @click="openCreateLesson(section)"><span>＋</span> Thêm bài học</button>
              <RouterLink :to="`/instructor/sections/${section.id}/quiz${section.quiz ? `?quizId=${section.quiz.id}` : ''}`" class="section-quiz-action">
                {{ section.quiz ? 'Chỉnh sửa Quiz' : 'Tạo Quiz' }}
              </RouterLink>
            </div>
          </div>
        </section>
        <button class="notion-add-section" type="button" @click="openCreateSection"><span>＋</span> Thêm chương</button>
        </aside>
        <section class="document-stage">
          <div v-if="activeLesson" class="document-page">
            <header class="document-title"><p>{{ sections.find(section => section.id === activeLesson?.sectionId)?.title }}</p><h2>{{ activeLesson.title }}</h2><div><span>{{ contentBlocks.length }} khối nội dung</span><button type="button" @click="openContentManager(activeLesson)">＋ Thêm nội dung</button></div></header>
            <div v-if="contentLoading" class="document-empty">Đang tải nội dung...</div>
            <div v-else-if="!contentBlocks.length" class="document-empty"><b>Trang bài học đang trống</b><p>Nhấn “＋ Thêm nội dung” để chèn văn bản, video hoặc tài liệu.</p></div>
            <article v-for="(block,index) in contentBlocks" v-else :key="block.id" class="document-block">
              <div class="document-block-label">{{ index + 1 }} · {{ lessonTypeLabel(block.contentType) }}</div>
              <div v-if="block.contentType === 'TEXT'" class="document-text" v-html="renderDocumentText(block.textContent)" />
              <video v-else-if="block.contentType === 'VIDEO' && block.fileUrl" :src="asset(block.fileUrl)" controls class="w-full bg-black" />
              <div v-else-if="block.contentType === 'DOCUMENT' && block.fileUrl" class="h-[34rem] overflow-hidden border border-slate-200"><VueOfficePdf v-if="block.fileUrl.toLowerCase().endsWith('.pdf')" :src="asset(block.fileUrl)" class="h-full w-full" /><VueOfficePptx v-else-if="/\.pptx?$/.test(block.fileUrl.toLowerCase())" :src="asset(block.fileUrl)" class="h-full w-full" /><VueOfficeDocx v-else-if="/\.docx?$/.test(block.fileUrl.toLowerCase())" :src="asset(block.fileUrl)" class="h-full w-full" /><iframe v-else :src="asset(block.fileUrl)" class="h-full w-full" /></div>
              <p v-else class="text-sm text-slate-400">Nội dung chưa có file.</p>
            </article>
          </div>
          <div v-else class="document-page document-empty"><b>Chọn hoặc tạo một bài học</b><p>Nội dung bài học sẽ được xem trước tại đây giống trang học của Student.</p></div>
        </section>
      </div>
    </main>

    <BaseModal :show="sectionModalOpen" :title="editingSection ? 'Đổi tên chương' : 'Thêm chương mới'" description="Tên chương nên ngắn gọn và thể hiện rõ nhóm kiến thức." @close="closeSectionModal"><form class="space-y-5" @submit.prevent="saveSection"><BaseInput id="section-title" v-model="sectionTitle" label="Tên chương" placeholder="Ví dụ: Làm quen với ExpressJS" required /><div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" @click="closeSectionModal">Hủy</BaseButton><BaseButton type="submit" :loading="sectionSaving">{{ editingSection ? 'Lưu thay đổi' : 'Thêm chương' }}</BaseButton></div></form></BaseModal>

    <BaseModal :show="lessonModalOpen" :title="editingLesson ? 'Cập nhật bài học' : 'Tạo bài học mới'" :description="targetSection ? `Thuộc chương: ${targetSection.title}. Nội dung sẽ được thêm sau bằng nút + trong bài học.` : undefined" @close="closeLessonModal">
      <form class="space-y-5" @submit.prevent="saveLesson">
        <BaseInput id="lesson-title" v-model="lessonForm.title" label="Tên bài học" placeholder="Ví dụ: Cài đặt môi trường phát triển" required />
        <div class="grid gap-3 bg-slate-50 p-4 dark:bg-slate-800/60 sm:grid-cols-2"><label class="flex items-start gap-3 text-sm"><input v-model="lessonForm.isPreview" type="checkbox" class="mt-1 accent-purple-600"><span><b class="block">Cho phép học thử</b><span class="text-xs text-slate-500">Khách có thể xem trước bài này.</span></span></label><label class="flex items-start gap-3 text-sm"><input v-model="lessonForm.isRequired" type="checkbox" class="mt-1 accent-purple-600"><span><b class="block">Bài học bắt buộc</b><span class="text-xs text-slate-500">Phải hoàn thành trước Quiz cuối chương.</span></span></label></div>
        <p v-if="error" class="bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
        <div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" :disabled="lessonSaving" @click="closeLessonModal">Hủy</BaseButton><BaseButton type="submit" :loading="lessonSaving">{{ editingLesson ? 'Lưu bài học' : 'Tạo bài học' }}</BaseButton></div>
      </form>
    </BaseModal>

    <BaseModal :show="Boolean(deleteTarget)" title="Xác nhận xóa" :description="deleteTarget?.kind === 'section' ? 'Toàn bộ bài học trong chương cũng sẽ bị xóa.' : 'Thao tác này không thể hoàn tác.'" size="sm" @close="!deleting && (deleteTarget = null)"><p class="text-sm leading-6 text-slate-600 dark:text-slate-300">Bạn có chắc muốn xóa <b>“{{ deleteTarget?.title }}”</b>?</p><div class="mt-6 flex justify-end gap-3"><BaseButton variant="secondary" :disabled="deleting" @click="deleteTarget = null">Hủy</BaseButton><BaseButton variant="danger" :loading="deleting" @click="confirmDelete">Xóa nội dung</BaseButton></div></BaseModal>
    <BaseModal :show="contentModalOpen" :title="`Nội dung · ${contentLesson?.title || ''}`" description="Một bài học có thể gồm nhiều nội dung. Dùng mũi tên để đổi thứ tự hiển thị." size="xl" @close="closeContentManager">
      <div v-if="contentLoading" class="py-10 text-center text-sm text-slate-500">Đang tải nội dung...</div>
      <div v-else class="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section class="space-y-3">
          <article v-for="(item,index) in contentBlocks" :key="item.id" class="content-block-row">
            <div class="content-order"><b>{{ index + 1 }}</b><button type="button" :disabled="index===0" @click="moveContent(index,-1)">↑</button><button type="button" :disabled="index===contentBlocks.length-1" @click="moveContent(index,1)">↓</button></div>
            <div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span :class="['lesson-kind',`lesson-kind--${item.contentType.toLowerCase()}`]">{{ lessonTypeLabel(item.contentType) }}</span><b class="truncate">{{ item.originalName || (item.contentType === 'TEXT' ? 'Nội dung văn bản' : 'Chưa tải file') }}</b></div><p v-if="item.textContent" class="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{{ item.textContent }}</p><p v-if="item.sizeBytes" class="mt-1 text-xs text-slate-400">{{ formatBytes(item.sizeBytes) }}</p><a v-if="item.fileUrl" :href="asset(item.fileUrl)" target="_blank" class="mt-2 inline-block text-xs font-bold text-purple-600">Xem trước file ↗</a></div>
            <BaseButton size="sm" variant="ghost" @click="removeContentBlock(item)">Xóa</BaseButton>
          </article>
          <p v-if="!contentBlocks.length" class="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Bài học chưa có nội dung.</p>
        </section>
        <form class="border-l border-slate-200 pl-6 dark:border-slate-800" @submit.prevent="addContentBlock">
          <h3 class="font-black">Thêm nội dung</h3><div class="mt-4 grid grid-cols-3 gap-2"><button v-for="type in (['TEXT','VIDEO','DOCUMENT'] as LessonType[])" :key="type" type="button" :class="['content-type',newContentType===type?'content-type--active':'']" @click="newContentType=type;newContentFile=null;contentFileKey+=1">{{ lessonTypeLabel(type) }}</button></div>
          <div v-if="newContentType==='TEXT'" class="mt-4"><div class="heading-toolbar" aria-label="Cấp tiêu đề"><button v-for="level in 5" :key="level" type="button" @click="insertHeading(level)">H{{ level }}</button></div><textarea v-model="newContentText" rows="10" class="builder-textarea" placeholder="Chọn H1–H5 hoặc nhập đoạn văn bản thường..." /><p class="mt-2 text-xs text-slate-400">Có thể dùng # đến ##### ở đầu dòng để tạo tiêu đề.</p></div>
          <label v-else class="file-drop mt-4 block cursor-pointer"><b>{{ newContentFile?.name || 'Chọn file từ máy' }}</b><span class="mt-1 block text-xs text-slate-500">{{ newContentType==='VIDEO'?'MP4, WebM':'PDF, DOC, DOCX, PPT, PPTX' }} · tối đa 100 MB</span><input :key="contentFileKey" type="file" class="sr-only" :accept="newContentType==='VIDEO'?'video/mp4,video/webm':'.pdf,.doc,.docx,.ppt,.pptx'" @change="selectContentFile"></label>
          <p v-if="error" class="mt-4 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p><BaseButton class="mt-4" type="submit" :loading="contentSaving" :full-width="true">Thêm vào cuối bài học</BaseButton>
        </form>
      </div>
    </BaseModal>
  </InstructorLayout>
</template>

<style scoped>
.builder-metric{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:1.1rem;background:var(--surface);padding:1rem 1.2rem;box-shadow:var(--shadow-sm)}.builder-metric span{color:var(--text-muted);font-size:.8rem;font-weight:600}.builder-metric b{font-size:1.25rem}.lesson-row{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;padding:1rem 1.25rem}.lesson-kind{display:grid;min-width:4.5rem;place-items:center;border-radius:.75rem;padding:.45rem .6rem;font-size:.65rem;font-weight:900;text-transform:uppercase}.lesson-kind--text{background:#ecfdf5;color:#047857}.lesson-kind--video{background:#eff6ff;color:#1d4ed8}.lesson-kind--document{background:#fff7ed;color:#c2410c}.content-type{border:1px solid var(--border);border-radius:.9rem;background:var(--surface-muted);padding:.8rem;font-size:.8rem;font-weight:700;color:var(--text-muted)}.content-type--active{border-color:#a855f7;background:var(--brand-soft);color:var(--brand);box-shadow:0 0 0 3px rgba(168,85,247,.08)}.builder-textarea{width:100%;resize:vertical;border:1px solid var(--border);border-radius:1rem;background:var(--surface-muted);padding:1rem;color:var(--text);outline:none}.builder-textarea:focus{border-color:#a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.1)}.file-drop{border:2px dashed var(--border-strong);border-radius:1.2rem;background:var(--surface-muted);padding:1.5rem;text-align:center}.file-drop:hover{border-color:#a855f7}
.content-block-row{display:flex;align-items:flex-start;gap:.85rem;border:1px solid var(--border);padding:1rem;background:var(--surface)}.content-order{display:grid;grid-template-columns:repeat(3,1.8rem);align-items:center;gap:.2rem}.content-order>*{display:grid;height:1.8rem;place-items:center;border:1px solid var(--border);background:var(--surface-muted);font-size:.75rem}.content-order button:disabled{cursor:not-allowed;opacity:.3}
.notion-section-header{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;border-bottom:1px solid var(--border);padding:1rem 1.25rem;background:var(--surface-muted)}.section-index{display:grid;height:2.5rem;width:2.5rem;place-items:center;background:var(--brand-soft);color:var(--brand);font-size:.75rem;font-weight:900}.notion-add-content{display:inline-flex;align-items:center;gap:.4rem;border:1px solid var(--border);padding:.5rem .7rem;color:var(--brand);font-size:.78rem;font-weight:800}.notion-add-content:hover,.notion-insert:hover,.notion-add-section:hover{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}.notion-add-content small{display:grid;min-width:1.2rem;height:1.2rem;place-items:center;background:var(--surface-muted);color:var(--text-muted)}.section-footer-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:stretch;border-top:1px solid var(--border);background:var(--surface)}.notion-insert{display:flex;align-items:center;gap:.55rem;border:0;padding:.75rem 1rem;text-align:left;color:var(--text-muted);font-size:.78rem;font-weight:750}.section-quiz-action{display:flex;align-items:center;border-left:1px solid var(--border);padding:.75rem 1rem;color:var(--brand);font-size:.78rem;font-weight:850;white-space:nowrap}.section-quiz-action:hover{background:var(--brand-soft)}.notion-add-section{display:flex;width:100%;align-items:center;justify-content:center;gap:.5rem;border:1px dashed var(--border-strong);padding:1rem;color:var(--text-muted);font-size:.9rem;font-weight:800}
.builder-docs-layout{display:grid;grid-template-columns:24rem minmax(0,1fr);min-height:calc(100vh - 15rem);border:1px solid var(--border);background:#eef0f3}.builder-outline{max-height:calc(100vh - 6rem);overflow-y:auto;border-right:1px solid var(--border);background:#f8fafc;padding:.65rem}.outline-section{margin-bottom:.65rem;overflow:hidden;border:1px solid var(--border);background:var(--surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}.builder-outline .notion-section-header{display:grid;grid-template-columns:2rem minmax(0,1fr) auto;gap:.65rem;padding:.75rem;background:var(--surface)}.builder-outline .section-index{width:2rem;height:2rem}.builder-outline .notion-section-header h2{font-size:.8rem;line-height:1.3}.builder-outline .notion-section-header>div:last-child :deep(button){min-height:1.75rem;padding:.25rem .4rem;font-size:.65rem}.builder-outline .lesson-row{display:grid;grid-template-columns:3.25rem minmax(0,1fr);gap:.65rem;cursor:pointer;padding:.7rem}.builder-outline .lesson-row>div:last-child{grid-column:2;justify-content:flex-start}.builder-outline .lesson-row>div:last-child :deep(button){min-height:1.7rem;padding:.2rem .35rem;font-size:.65rem}.builder-outline .lesson-row h3{font-size:.78rem;line-height:1.35}.builder-outline .lesson-row--active{border-left:3px solid var(--brand);background:var(--brand-soft)}.builder-outline .lesson-kind{min-width:3.25rem}.builder-outline .notion-add-content{padding:.3rem .45rem}.builder-outline .notion-add-content span{display:none}.builder-outline .section-footer-actions{font-size:.75rem}.document-stage{overflow:auto;padding:2rem}.document-page{width:min(100%,56rem);min-height:70rem;margin:0 auto;background:white;padding:4rem 5rem;box-shadow:0 2px 16px rgba(15,23,42,.14);color:#111827}.document-title{border-bottom:1px solid #e5e7eb;padding-bottom:1.25rem}.document-title>p{color:#7c3aed;font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.12em}.document-title h2{max-width:46rem;margin-top:.5rem;font-size:1.75rem;font-weight:900;line-height:1.25}.document-title>div{display:flex;align-items:center;justify-content:space-between;margin-top:1rem;color:#64748b;font-size:.75rem}.document-title button{border:1px solid #c4b5fd;padding:.45rem .7rem;color:#6d28d9;font-weight:800}.document-block{position:relative;padding:1.75rem 0;border-bottom:1px solid #f1f5f9}.document-block-label{margin-bottom:1rem;color:#94a3b8;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.document-text{color:#1f2937}.document-text :deep(h1){margin:1.6rem 0 .8rem;font-size:2rem;line-height:1.2;font-weight:900}.document-text :deep(h2){margin:1.4rem 0 .7rem;font-size:1.65rem;line-height:1.25;font-weight:850}.document-text :deep(h3){margin:1.2rem 0 .6rem;font-size:1.35rem;line-height:1.3;font-weight:800}.document-text :deep(h4){margin:1rem 0 .5rem;font-size:1.12rem;line-height:1.35;font-weight:800}.document-text :deep(h5){margin:.9rem 0 .45rem;font-size:.95rem;line-height:1.4;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.document-text :deep(p){margin:.55rem 0;font-size:1rem;line-height:1.85}.document-empty{display:grid;min-height:24rem;place-items:center;align-content:center;text-align:center;color:#64748b}.document-empty b{color:#111827;font-size:1.1rem}.document-empty p{margin-top:.5rem;font-size:.82rem}.heading-toolbar{display:flex;border:1px solid var(--border);border-bottom:0;background:var(--surface-muted)}.heading-toolbar button{min-width:2.6rem;border-right:1px solid var(--border);padding:.45rem;font-size:.72rem;font-weight:850;color:var(--text-muted)}.heading-toolbar button:hover{background:var(--brand-soft);color:var(--brand)}
@media(max-width:1100px){.builder-docs-layout{grid-template-columns:1fr}.builder-outline{max-height:none;border-right:0}.document-stage{padding:1rem}.document-page{min-height:40rem;padding:2rem}}
</style>
