<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Quiz, QuizQuestion } from '@/types'

type DraftOption = { id?: string; text: string; isCorrect: boolean }
const route = useRoute()
const api = useApi()
const lessonId = String(route.params.lessonId)
const quiz = ref<Quiz | null>(null)
const error = ref('')
const message = ref('')
const savingQuiz = ref(false)
const questionModalOpen = ref(false)
const editingQuestion = ref<QuizQuestion | null>(null)
const questionSaving = ref(false)
const removedOptionIds = ref<string[]>([])
const deleteQuestionTarget = ref<QuizQuestion | null>(null)
const deleting = ref(false)
const form = reactive({ title: 'Bài kiểm tra', description: '', passingScore: 70, maxAttempts: 3, timeLimitMinutes: 15 })
const questionForm = reactive<{ text: string; explanation: string; points: number; options: DraftOption[] }>({ text: '', explanation: '', points: 1, options: [] })
const totalPoints = computed(() => quiz.value?.questions?.reduce((sum, question) => sum + question.points, 0) || 0)
const canPublish = computed(() => Boolean(quiz.value?.questions?.length && quiz.value.questions.every((question) => question.options.length >= 2 && question.options.filter((option) => option.isCorrect).length === 1)))

async function load() {
  const id = String(route.query.quizId || '')
  if (!id) return
  try {
    const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`)
    quiz.value = response.data || null
    if (quiz.value) Object.assign(form, { title: quiz.value.title, description: quiz.value.description || '', passingScore: quiz.value.passingScore, maxAttempts: quiz.value.maxAttempts, timeLimitMinutes: quiz.value.timeLimitMinutes || 15 })
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không tải được quiz' }
}

async function reload() {
  if (!quiz.value) return
  const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${quiz.value.id}`)
  quiz.value = response.data || null
}

async function saveQuiz() {
  savingQuiz.value = true; error.value = ''; message.value = ''
  try {
    const payload = { ...form, title: form.title.trim(), description: form.description.trim() || null, passingScore: Number(form.passingScore), maxAttempts: Number(form.maxAttempts), timeLimitMinutes: Number(form.timeLimitMinutes) }
    const response = quiz.value ? await api.patch<ApiResponse<Quiz>>(`/quizzes/${quiz.value.id}`, payload) : await api.post<ApiResponse<Quiz>>(`/lessons/${lessonId}/quizzes`, payload)
    quiz.value = response.data || quiz.value
    if (quiz.value) window.history.replaceState({}, '', `${location.pathname}?quizId=${quiz.value.id}`)
    message.value = 'Đã lưu cấu hình bài kiểm tra.'
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không lưu được quiz' }
  finally { savingQuiz.value = false }
}

function resetQuestionForm() { questionForm.text = ''; questionForm.explanation = ''; questionForm.points = 1; questionForm.options = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]; removedOptionIds.value = [] }
function openCreateQuestion() { editingQuestion.value = null; resetQuestionForm(); questionModalOpen.value = true; error.value = '' }
function openEditQuestion(question: QuizQuestion) {
  editingQuestion.value = question
  questionForm.text = question.text; questionForm.explanation = question.explanation || ''; questionForm.points = question.points
  questionForm.options = question.options.map((option) => ({ id: option.id, text: option.text, isCorrect: Boolean(option.isCorrect) }))
  removedOptionIds.value = []; questionModalOpen.value = true; error.value = ''
}
function addDraftOption() { questionForm.options.push({ text: '', isCorrect: false }) }
function makeCorrect(index: number) { questionForm.options.forEach((option, optionIndex) => { option.isCorrect = optionIndex === index }) }
function removeDraftOption(index: number) { const option = questionForm.options[index]; if (option?.id) removedOptionIds.value.push(option.id); questionForm.options.splice(index, 1) }
function closeQuestionModal() { if (!questionSaving.value) questionModalOpen.value = false }

async function saveQuestion() {
  error.value = ''
  const text = questionForm.text.trim()
  const validOptions = questionForm.options.filter((option) => option.text.trim())
  if (!text) { error.value = 'Vui lòng nhập nội dung câu hỏi.'; return }
  if (validOptions.length < 2) { error.value = 'Mỗi câu hỏi cần ít nhất 2 đáp án.'; return }
  if (validOptions.filter((option) => option.isCorrect).length !== 1) { error.value = 'Hãy chọn đúng 1 đáp án chính xác.'; return }
  if (!quiz.value) return
  questionSaving.value = true
  try {
    const questionPayload = { text, explanation: questionForm.explanation.trim() || null, points: Number(questionForm.points) }
    let questionId = editingQuestion.value?.id
    if (questionId) await api.patch(`/questions/${questionId}`, questionPayload)
    else {
      const response = await api.post<ApiResponse<QuizQuestion>>(`/quizzes/${quiz.value.id}/questions`, { ...questionPayload, position: (quiz.value.questions?.length || 0) + 1 })
      if (!response.data) throw new Error('Không nhận được câu hỏi vừa tạo')
      questionId = response.data.id
    }
    await Promise.all(removedOptionIds.value.map((id) => api.del(`/options/${id}`)))
    for (let index = 0; index < validOptions.length; index += 1) {
      const option = validOptions[index]
      const payload = { text: option.text.trim(), isCorrect: option.isCorrect, position: index + 1 }
      if (option.id) await api.patch(`/options/${option.id}`, payload)
      else await api.post(`/questions/${questionId}/options`, payload)
    }
    await reload(); questionModalOpen.value = false; message.value = editingQuestion.value ? 'Đã cập nhật câu hỏi.' : 'Đã thêm câu hỏi.'
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể lưu câu hỏi' }
  finally { questionSaving.value = false }
}

async function removeQuestion() {
  if (!deleteQuestionTarget.value) return
  deleting.value = true
  try { await api.del(`/questions/${deleteQuestionTarget.value.id}`); deleteQuestionTarget.value = null; message.value = 'Đã xóa câu hỏi.'; await reload() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể xóa câu hỏi' }
  finally { deleting.value = false }
}

async function publish() {
  if (!quiz.value) return
  if (!quiz.value.isPublished && !canPublish.value) { error.value = 'Mỗi câu hỏi cần ít nhất 2 đáp án và đúng 1 đáp án chính xác trước khi xuất bản.'; return }
  try { await api.patch(`/quizzes/${quiz.value.id}`, { isPublished: !quiz.value.isPublished }); await reload(); message.value = quiz.value?.isPublished ? 'Quiz đã được xuất bản.' : 'Quiz đã chuyển về bản nháp.' }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể đổi trạng thái quiz' }
}
onMounted(load)
</script>

<template>
  <InstructorLayout>
    <main class="app-page max-w-6xl">
      <header class="flex flex-wrap items-end justify-between gap-5"><div><button class="text-sm font-bold text-purple-600 dark:text-purple-400" @click="$router.back()">← Quay lại Course Builder</button><div class="mt-3 flex flex-wrap items-center gap-3"><h1 class="app-page-title">Quiz Builder</h1><span v-if="quiz" :class="['rounded-full px-3 py-1 text-xs font-bold', quiz.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300']">{{ quiz.isPublished ? 'Đã xuất bản' : 'Bản nháp' }}</span></div><p class="app-page-description">Thiết lập bài kiểm tra, câu hỏi và đáp án trong cùng một không gian.</p></div><BaseButton v-if="quiz" :variant="quiz.isPublished ? 'secondary' : 'primary'" size="lg" @click="publish">{{ quiz.isPublished ? 'Chuyển về nháp' : 'Xuất bản quiz' }}</BaseButton></header>
      <p v-if="error" class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p><p v-if="message" class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{{ message }}</p>

      <section class="surface-card mt-7 p-5 sm:p-7"><div class="mb-6"><p class="text-xs font-bold uppercase tracking-wider text-purple-600">Thiết lập chung</p><h2 class="mt-2 text-xl font-extrabold">Cấu hình bài kiểm tra</h2></div><form class="space-y-5" @submit.prevent="saveQuiz"><BaseInput id="quiz-title" v-model="form.title" label="Tên bài kiểm tra" required /><div class="space-y-2"><label for="quiz-description" class="text-sm font-semibold">Mô tả</label><textarea id="quiz-description" v-model="form.description" rows="3" class="quiz-textarea" placeholder="Mô tả ngắn về mục tiêu bài kiểm tra" /></div><div class="grid gap-4 sm:grid-cols-3"><BaseInput id="passing-score" v-model="form.passingScore" type="number" label="Điểm đạt (%)" required /><BaseInput id="max-attempts" v-model="form.maxAttempts" type="number" label="Số lần làm tối đa" required /><BaseInput id="time-limit" v-model="form.timeLimitMinutes" type="number" label="Thời gian (phút)" required /></div><div class="flex justify-end"><BaseButton type="submit" :loading="savingQuiz">{{ quiz ? 'Lưu cấu hình' : 'Tạo quiz và tiếp tục' }}</BaseButton></div></form></section>

      <template v-if="quiz"><section class="mt-6 grid gap-4 sm:grid-cols-3"><article class="quiz-metric"><span>Câu hỏi</span><b>{{ quiz.questions?.length || 0 }}</b></article><article class="quiz-metric"><span>Tổng điểm</span><b>{{ totalPoints }}</b></article><article class="quiz-metric"><span>Điểm đạt</span><b>{{ quiz.passingScore }}%</b></article></section><div class="mt-8 flex items-center justify-between gap-4"><div><h2 class="text-2xl font-black">Danh sách câu hỏi</h2><p class="mt-1 text-sm text-slate-500">Mỗi câu hỏi cần đúng một đáp án chính xác.</p></div><BaseButton @click="openCreateQuestion">+ Thêm câu hỏi</BaseButton></div>
        <section v-if="quiz.questions?.length" class="mt-5 space-y-4"><article v-for="(question, index) in quiz.questions" :key="question.id" class="surface-card overflow-hidden"><header class="flex items-start gap-4 border-b border-slate-100 p-5 dark:border-slate-800"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-sm font-black text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">{{ index + 1 }}</span><div class="min-w-0 flex-1"><h3 class="font-extrabold leading-6">{{ question.text }}</h3><p class="mt-1 text-xs text-slate-500">{{ question.points }} điểm · {{ question.options.length }} đáp án</p></div><div class="flex gap-1"><BaseButton size="sm" variant="ghost" @click="openEditQuestion(question)">Sửa</BaseButton><BaseButton size="sm" variant="ghost" @click="deleteQuestionTarget = question">Xóa</BaseButton></div></header><div class="grid gap-2 p-5 sm:grid-cols-2"><div v-for="(option, optionIndex) in question.options" :key="option.id" :class="['option-row', option.isCorrect ? 'option-row--correct' : '']"><span :class="['option-letter', option.isCorrect ? 'option-letter--correct' : '']">{{ String.fromCharCode(65 + optionIndex) }}</span><span class="min-w-0 flex-1 text-sm font-medium">{{ option.text }}</span><span v-if="option.isCorrect" class="text-xs font-bold text-emerald-600">Đáp án đúng</span></div></div><p v-if="question.explanation" class="mx-5 mb-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"><b>Giải thích:</b> {{ question.explanation }}</p></article></section>
        <section v-else class="surface-card mt-5 grid min-h-72 place-items-center border-dashed p-8 text-center"><div><span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-purple-50 text-2xl text-purple-600 dark:bg-purple-950/40">?</span><h3 class="mt-4 text-lg font-extrabold">Chưa có câu hỏi</h3><p class="mt-2 text-sm text-slate-500">Thêm câu hỏi và đáp án để hoàn thiện bài kiểm tra.</p><BaseButton class="mt-5" @click="openCreateQuestion">Tạo câu hỏi đầu tiên</BaseButton></div></section>
      </template>
    </main>

    <BaseModal :show="questionModalOpen" :title="editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'" description="Nhập câu hỏi, các lựa chọn và đánh dấu một đáp án đúng." size="lg" @close="closeQuestionModal"><form class="space-y-5" @submit.prevent="saveQuestion"><div class="space-y-2"><label for="question-text" class="text-sm font-semibold">Nội dung câu hỏi</label><textarea id="question-text" v-model="questionForm.text" rows="3" class="quiz-textarea" placeholder="Nhập nội dung câu hỏi..." /></div><div class="grid gap-4 sm:grid-cols-[1fr_140px]"><BaseInput id="question-explanation" v-model="questionForm.explanation" label="Giải thích sau khi chấm" placeholder="Không bắt buộc" /><BaseInput id="question-points" v-model="questionForm.points" type="number" label="Số điểm" required /></div><div><div class="mb-3 flex items-center justify-between"><label class="text-sm font-semibold">Các đáp án</label><button type="button" class="text-sm font-bold text-purple-600" @click="addDraftOption">+ Thêm đáp án</button></div><div class="space-y-2"><div v-for="(option, index) in questionForm.options" :key="option.id || index" class="draft-option"><button type="button" :class="['correct-radio', option.isCorrect ? 'correct-radio--active' : '']" :aria-label="`Chọn đáp án ${index + 1} là đáp án đúng`" @click="makeCorrect(index)">{{ option.isCorrect ? '✓' : String.fromCharCode(65 + index) }}</button><input v-model="option.text" class="min-w-0 flex-1 bg-transparent text-sm outline-none" :placeholder="`Đáp án ${String.fromCharCode(65 + index)}`" /><button v-if="questionForm.options.length > 2" type="button" class="text-sm font-bold text-red-500" @click="removeDraftOption(index)">Xóa</button></div></div><p class="mt-2 text-xs text-slate-500">Nhấn vào ký hiệu bên trái để chọn đáp án đúng.</p></div><p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p><div class="flex justify-end gap-3"><BaseButton type="button" variant="secondary" @click="closeQuestionModal">Hủy</BaseButton><BaseButton type="submit" :loading="questionSaving">{{ editingQuestion ? 'Lưu câu hỏi' : 'Thêm câu hỏi' }}</BaseButton></div></form></BaseModal>
    <BaseModal :show="Boolean(deleteQuestionTarget)" title="Xóa câu hỏi?" description="Các đáp án của câu hỏi cũng sẽ bị xóa." size="sm" @close="!deleting && (deleteQuestionTarget = null)"><p class="text-sm leading-6 text-slate-600 dark:text-slate-300">Bạn có chắc muốn xóa <b>“{{ deleteQuestionTarget?.text }}”</b>?</p><div class="mt-6 flex justify-end gap-3"><BaseButton variant="secondary" :disabled="deleting" @click="deleteQuestionTarget = null">Hủy</BaseButton><BaseButton variant="danger" :loading="deleting" @click="removeQuestion">Xóa câu hỏi</BaseButton></div></BaseModal>
  </InstructorLayout>
</template>

<style scoped>
.quiz-textarea{width:100%;resize:vertical;border:1px solid var(--border);border-radius:1rem;background:var(--surface-muted);padding:1rem;color:var(--text);outline:none}.quiz-textarea:focus{border-color:#a855f7;box-shadow:0 0 0 4px rgba(168,85,247,.1)}.quiz-metric{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:1.1rem;background:var(--surface);padding:1rem 1.2rem}.quiz-metric span{font-size:.8rem;font-weight:600;color:var(--text-muted)}.quiz-metric b{font-size:1.25rem}.option-row{display:flex;align-items:center;gap:.75rem;border:1px solid var(--border);border-radius:.9rem;background:var(--surface-muted);padding:.75rem}.option-row--correct{border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08)}.option-letter,.correct-radio{display:grid;width:1.8rem;height:1.8rem;flex-shrink:0;place-items:center;border:1px solid var(--border);border-radius:.55rem;background:var(--surface);font-size:.7rem;font-weight:900}.option-letter--correct,.correct-radio--active{border-color:#10b981;background:#10b981;color:white}.draft-option{display:flex;align-items:center;gap:.75rem;border:1px solid var(--border);border-radius:.9rem;background:var(--surface-muted);padding:.6rem .75rem}.correct-radio{cursor:pointer}
</style>
