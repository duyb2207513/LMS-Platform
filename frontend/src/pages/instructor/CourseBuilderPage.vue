<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, CourseSection, Lesson } from '@/types'

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

const lessonForm = reactive({ title: '', lessonType: 'TEXT' as LessonType, content: '', isPreview: false, isRequired: true })
const totalLessons = computed(() => sections.value.reduce((total, section) => total + section.lessons.length, 0))
const publishedLessons = computed(() => sections.value.flatMap((section) => section.lessons).filter((lesson) => lesson.isPublished).length)
const acceptedLessonFiles = computed(() => lessonForm.lessonType === 'VIDEO' ? 'video/mp4,video/webm' : '.pdf,.doc,.docx,.ppt,.pptx,application/pdf')
const currentLessonFileUrl = computed(() => !editingLesson.value ? null : editingLesson.value.lessonType === 'VIDEO' ? editingLesson.value.videoUrl : editingLesson.value.documentUrl)
const lessonTypeLabel = (type: LessonType) => ({ TEXT: 'Văn bản', VIDEO: 'Video', DOCUMENT: 'Tài liệu' }[type])

watch(() => lessonForm.lessonType, () => { lessonFile.value = null; fileInputKey.value += 1 })

async function load() {
  try { const response = await api.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`); sections.value = response.data || [] }
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
  if (lessonForm.lessonType === 'TEXT' && !lessonForm.content.trim()) { error.value = 'Vui lòng nhập nội dung bài học'; return }
  const typeChanged = Boolean(editingLesson.value && editingLesson.value.lessonType !== lessonForm.lessonType)
  if (lessonForm.lessonType !== 'TEXT' && !lessonFile.value && (!editingLesson.value || typeChanged)) { error.value = 'Vui lòng chọn file cho bài học'; return }
  lessonSaving.value = true
  try {
    const payload = { title: lessonForm.title.trim(), lessonType: lessonForm.lessonType, content: lessonForm.lessonType === 'TEXT' ? lessonForm.content.trim() : null, isPreview: lessonForm.isPreview, isRequired: lessonForm.isRequired, ...(typeChanged && lessonForm.lessonType !== 'TEXT' ? { isPublished: false } : {}) }
    let lessonId = editingLesson.value?.id
    if (lessonId) await api.patch(`/lessons/${lessonId}`, payload)
    else {
      if (!targetSection.value) throw new Error('Không xác định được chương của bài học')
      const response = await api.post<ApiResponse<Lesson>>(`/sections/${targetSection.value.id}/lessons`, { ...payload, position: targetSection.value.lessons.length + 1, isPublished: false })
      if (!response.data) throw new Error('Không nhận được thông tin bài học vừa tạo')
      lessonId = response.data.id
    }
    if (lessonFile.value) { const body = new FormData(); body.append('file', lessonFile.value); await api.post(`/lessons/${lessonId}/file`, body) }
    message.value = editingLesson.value ? 'Đã lưu bài học và nội dung.' : 'Đã tạo bài học mới.'
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
onMounted(load)
</script>

<template>
  <InstructorLayout>
    <main class="app-page max-w-6xl">
      <header class="flex flex-wrap items-end justify-between gap-5"><div><RouterLink to="/instructor/courses" class="text-sm font-bold text-purple-600 dark:text-purple-400">← Khóa học của tôi</RouterLink><h1 class="app-page-title mt-3">Xây dựng nội dung khóa học</h1><p class="app-page-description">Sắp xếp chương, tạo bài học và chuẩn bị bài kiểm tra cho học viên.</p></div><BaseButton size="lg" @click="openCreateSection">+ Thêm chương</BaseButton></header>

      <section class="mt-8 grid gap-4 sm:grid-cols-3"><article class="builder-metric"><span>Tổng chương</span><b>{{ sections.length }}</b></article><article class="builder-metric"><span>Tổng bài học</span><b>{{ totalLessons }}</b></article><article class="builder-metric"><span>Đã xuất bản</span><b>{{ publishedLessons }}/{{ totalLessons }}</b></article></section>
      <p v-if="error" class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
      <p v-if="message" class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{{ message }}</p>
      <div v-if="api.loading.value && !sections.length" class="surface-card mt-6 py-16 text-center text-slate-500">Đang tải nội dung...</div>
      <section v-else-if="!sections.length" class="surface-card mt-6 grid min-h-80 place-items-center border-dashed p-8 text-center"><div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-3xl text-purple-600 dark:bg-purple-950/40">＋</span><h2 class="mt-5 text-xl font-extrabold">Bắt đầu với chương đầu tiên</h2><p class="mt-2 max-w-md text-sm leading-6 text-slate-500">Chia khóa học thành các chương nhỏ, sau đó thêm video, bài đọc, tài liệu và quiz.</p><BaseButton class="mt-5" @click="openCreateSection">Thêm chương</BaseButton></div></section>

      <div v-else class="mt-6 space-y-5">
        <section v-for="(section, sectionIndex) in sections" :key="section.id" class="surface-card overflow-hidden">
          <header class="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/25 sm:p-5"><span class="grid h-11 w-11 place-items-center rounded-xl bg-purple-100 text-sm font-black text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">{{ String(sectionIndex + 1).padStart(2, '0') }}</span><div class="min-w-48 flex-1"><h2 class="font-extrabold">{{ section.title }}</h2><p class="mt-1 text-xs text-slate-500">{{ section.lessons.length }} bài học</p></div><div class="flex flex-wrap items-center gap-1"><BaseButton size="sm" variant="ghost" @click="openEditSection(section)">Sửa chương</BaseButton><BaseButton size="sm" variant="ghost" @click="askDeleteSection(section)">Xóa</BaseButton><BaseButton size="sm" @click="openCreateLesson(section)">+ Bài học</BaseButton></div></header>
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <article v-for="lesson in section.lessons" :key="lesson.id" class="lesson-row"><span :class="['lesson-kind', `lesson-kind--${lesson.lessonType.toLowerCase()}`]">{{ lessonTypeLabel(lesson.lessonType) }}</span><div class="min-w-44 flex-1"><div class="flex flex-wrap items-center gap-2"><h3 class="font-bold">{{ lesson.position }}. {{ lesson.title }}</h3><span v-if="lesson.isPreview" class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">Học thử</span></div><p :class="['mt-1 text-xs font-medium', lesson.isPublished ? 'text-emerald-600' : 'text-amber-600']">{{ lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp' }}<span v-if="lesson.videoUrl || lesson.documentUrl"> · Đã tải file</span></p></div><div class="flex flex-wrap items-center justify-end gap-1"><RouterLink :to="`/instructor/lessons/${lesson.id}/quiz${lesson.quiz ? `?quizId=${lesson.quiz.id}` : ''}`"><BaseButton size="sm" variant="outline">Quiz</BaseButton></RouterLink><BaseButton size="sm" variant="ghost" @click="openEditLesson(lesson)">Sửa</BaseButton><BaseButton size="sm" variant="ghost" @click="toggleLesson(lesson)">{{ lesson.isPublished ? 'Ẩn' : 'Xuất bản' }}</BaseButton><BaseButton size="sm" variant="ghost" @click="askDeleteLesson(lesson)">Xóa</BaseButton></div></article>
            <div v-if="!section.lessons.length" class="p-7 text-center"><p class="text-sm text-slate-500">Chương này chưa có bài học.</p><button class="mt-2 text-sm font-bold text-purple-600" @click="openCreateLesson(section)">+ Tạo bài học đầu tiên</button></div>
          </div>
        </section>
      </div>
    </main>

    <BaseModal :show="sectionModalOpen" :title="editingSection ? 'Đổi tên chương' : 'Thêm chương mới'" description="Tên chương nên ngắn gọn và thể hiện rõ nhóm kiến thức." @close="closeSectionModal"><form class="space-y-5" @submit.prevent="saveSection"><BaseInput id="section-title" v-model="sectionTitle" label="Tên chương" placeholder="Ví dụ: Làm quen với ExpressJS" required /><div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" @click="closeSectionModal">Hủy</BaseButton><BaseButton type="submit" :loading="sectionSaving">{{ editingSection ? 'Lưu thay đổi' : 'Thêm chương' }}</BaseButton></div></form></BaseModal>

    <BaseModal :show="lessonModalOpen" :title="editingLesson ? 'Cập nhật bài học' : 'Tạo bài học'" :description="targetSection ? `Thuộc chương: ${targetSection.title}` : undefined" size="lg" @close="closeLessonModal"><form class="space-y-5" @submit.prevent="saveLesson"><BaseInput id="lesson-title" v-model="lessonForm.title" label="Tên bài học" placeholder="Nhập tên bài học" required /><div class="space-y-2"><label class="block text-sm font-semibold">Loại nội dung</label><div class="grid grid-cols-3 gap-2"><button v-for="type in (['TEXT','VIDEO','DOCUMENT'] as LessonType[])" :key="type" type="button" :class="['content-type', lessonForm.lessonType === type ? 'content-type--active' : '']" @click="lessonForm.lessonType = type">{{ lessonTypeLabel(type) }}</button></div></div><div v-if="lessonForm.lessonType === 'TEXT'" class="space-y-2"><label for="lesson-content" class="block text-sm font-semibold">Nội dung bài học</label><textarea id="lesson-content" v-model="lessonForm.content" rows="10" class="builder-textarea" placeholder="Soạn nội dung bài học..." /></div><div v-else class="file-drop"><label for="lesson-file" class="cursor-pointer"><span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-xl text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">↑</span><b class="mt-3 block">{{ lessonFile ? lessonFile.name : lessonForm.lessonType === 'VIDEO' ? 'Chọn video từ máy' : 'Chọn tài liệu từ máy' }}</b><span class="mt-1 block text-xs text-slate-500">{{ lessonForm.lessonType === 'VIDEO' ? 'MP4, WebM' : 'PDF, DOC, DOCX, PPT, PPTX' }} · tối đa 100 MB</span></label><a v-if="currentLessonFileUrl && editingLesson?.lessonType === lessonForm.lessonType" :href="currentLessonFileUrl" target="_blank" class="mt-3 inline-block text-sm font-bold text-purple-600">Xem file hiện tại ↗</a><input :key="fileInputKey" id="lesson-file" type="file" :accept="acceptedLessonFiles" class="sr-only" @change="selectLessonFile" /></div><div class="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 sm:grid-cols-2"><label class="flex items-start gap-3 text-sm"><input v-model="lessonForm.isPreview" type="checkbox" class="mt-1 accent-purple-600"><span><b class="block">Cho phép học thử</b><span class="text-xs text-slate-500">Khách có thể xem trước bài này.</span></span></label><label class="flex items-start gap-3 text-sm"><input v-model="lessonForm.isRequired" type="checkbox" class="mt-1 accent-purple-600"><span><b class="block">Bài học bắt buộc</b><span class="text-xs text-slate-500">Tính vào tiến độ hoàn thành.</span></span></label></div><p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p><div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" :disabled="lessonSaving" @click="closeLessonModal">Hủy</BaseButton><BaseButton type="submit" :loading="lessonSaving">{{ editingLesson ? 'Lưu bài học' : 'Tạo bài học' }}</BaseButton></div></form></BaseModal>

    <BaseModal :show="Boolean(deleteTarget)" title="Xác nhận xóa" :description="deleteTarget?.kind === 'section' ? 'Toàn bộ bài học trong chương cũng sẽ bị xóa.' : 'Thao tác này không thể hoàn tác.'" size="sm" @close="!deleting && (deleteTarget = null)"><p class="text-sm leading-6 text-slate-600 dark:text-slate-300">Bạn có chắc muốn xóa <b>“{{ deleteTarget?.title }}”</b>?</p><div class="mt-6 flex justify-end gap-3"><BaseButton variant="secondary" :disabled="deleting" @click="deleteTarget = null">Hủy</BaseButton><BaseButton variant="danger" :loading="deleting" @click="confirmDelete">Xóa nội dung</BaseButton></div></BaseModal>
  </InstructorLayout>
</template>

<style scoped>
.builder-metric{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:1.1rem;background:var(--surface);padding:1rem 1.2rem;box-shadow:var(--shadow-sm)}.builder-metric span{color:var(--text-muted);font-size:.8rem;font-weight:600}.builder-metric b{font-size:1.25rem}.lesson-row{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;padding:1rem 1.25rem}.lesson-kind{display:grid;min-width:4.5rem;place-items:center;border-radius:.75rem;padding:.45rem .6rem;font-size:.65rem;font-weight:900;text-transform:uppercase}.lesson-kind--text{background:#ecfdf5;color:#047857}.lesson-kind--video{background:#eff6ff;color:#1d4ed8}.lesson-kind--document{background:#fff7ed;color:#c2410c}.content-type{border:1px solid var(--border);border-radius:.9rem;background:var(--surface-muted);padding:.8rem;font-size:.8rem;font-weight:700;color:var(--text-muted)}.content-type--active{border-color:#a855f7;background:var(--brand-soft);color:var(--brand);box-shadow:0 0 0 3px rgba(168,85,247,.08)}.builder-textarea{width:100%;resize:vertical;border:1px solid var(--border);border-radius:1rem;background:var(--surface-muted);padding:1rem;color:var(--text);outline:none}.builder-textarea:focus{border-color:#a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.1)}.file-drop{border:2px dashed var(--border-strong);border-radius:1.2rem;background:var(--surface-muted);padding:1.5rem;text-align:center}.file-drop:hover{border-color:#a855f7}
</style>
