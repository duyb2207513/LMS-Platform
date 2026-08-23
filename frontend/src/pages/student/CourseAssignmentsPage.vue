<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, ClipboardList } from '@lucide/vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Assignment, CourseGrade } from '@/types'

const route = useRoute()
const api = useApi()
const courseId = String(route.params.courseId)
const items = ref<Assignment[]>([])
const grade = ref<CourseGrade | null>(null)
const error = ref('')
const pending = computed(() => items.value.filter((item) => !item.submissions?.length).length)
const graded = computed(() => items.value.filter((item) => item.submissions?.[0]?.feedback).length)
const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN')

async function load() {
  try {
    const [assignments, result] = await Promise.all([
      api.get<ApiResponse<Assignment[]>>(`/courses/${courseId}/assignments`),
      api.get<ApiResponse<CourseGrade>>(`/courses/${courseId}/grades/me`),
    ])
    items.value = assignments.data || []
    grade.value = result.data || null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải bài tập'
  }
}

onMounted(load)
</script>

<template>
  <DefaultLayout>
    <main class="app-page navbar-page assignments-page">
      <header>
        <RouterLink :to="`/learn/${courseId}`" class="grid h-9 w-9 place-items-center border border-purple-200 text-purple-600 hover:bg-purple-50" aria-label="Trở lại bài học" title="Trở lại bài học">
          <ArrowLeft :size="17" />
        </RouterLink>
        <p class="mt-4 text-sm font-bold uppercase tracking-wider text-purple-600">Bài tập &amp; điểm số</p>
        <h1 class="app-page-title mt-2">Kết quả học tập</h1>
        <p class="app-page-description">Nộp bài đúng hạn, xem nhận xét và theo dõi điểm tổng kết khóa học.</p>
      </header>

      <p v-if="error" class="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>

      <section v-if="grade" class="grade-summary mt-7">
        <div>
          <p class="text-xs font-black uppercase tracking-[.14em] text-slate-500">Điểm tổng kết hiện tại</p>
          <div class="mt-2 flex items-end gap-2"><span class="text-5xl font-black text-slate-950 dark:text-white">{{ grade.finalScore }}</span><span class="pb-1.5 text-lg text-slate-400">/ 100</span></div>
          <span :class="['mt-3 inline-flex border px-2.5 py-1 text-xs font-black', grade.passed ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : 'border-amber-300 text-amber-700 dark:text-amber-300']">{{ grade.passed ? 'Đạt yêu cầu' : 'Chưa đạt' }}</span>
        </div>
        <div class="grid min-w-64 grid-cols-2 gap-3">
          <div class="grade-breakdown"><p>Bài tập</p><b>{{ grade.assignment.percent }}%</b><span>Trọng số {{ grade.rule.assignmentWeight }}%</span></div>
          <div class="grade-breakdown"><p>Quiz</p><b>{{ grade.quiz.percent }}%</b><span>Trọng số {{ grade.rule.quizWeight }}%</span></div>
        </div>
      </section>

      <section class="mt-5 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <article class="metric-card"><b>{{ items.length }}</b><span>Tổng bài tập</span></article>
        <article class="metric-card"><b class="text-amber-600">{{ pending }}</b><span>Chưa nộp</span></article>
        <article class="metric-card"><b class="text-emerald-600">{{ graded }}</b><span>Đã có điểm</span></article>
      </section>

      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <section v-else-if="items.length" class="mt-5 border border-[var(--border)] bg-[var(--surface)]">
        <RouterLink v-for="item in items" :key="item.id" :to="`/assignments/${item.id}`" class="assignment-row group">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span :class="['border px-2.5 py-1 text-xs font-bold', item.submissions?.[0]?.feedback ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : item.submissions?.length ? 'border-blue-200 bg-blue-50 text-blue-700' : item.isOverdue ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700']">{{ item.submissions?.[0]?.feedback ? 'Đã chấm' : item.submissions?.length ? 'Đã nộp' : item.isOverdue ? 'Quá hạn' : 'Cần thực hiện' }}</span>
              <span class="text-xs text-slate-400">{{ item.maxScore }} điểm</span>
            </div>
            <h2 class="mt-2 text-lg font-black group-hover:text-purple-700">{{ item.title }}</h2>
            <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ item.description || 'Xem hướng dẫn và nộp bài.' }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-4 text-right">
            <div><p class="text-xs text-slate-400">Hạn nộp</p><b class="mt-1 block text-sm">{{ formatDate(item.dueAt) }}</b><p v-if="item.submissions?.[0]?.feedback" class="mt-2 font-black text-emerald-600">{{ item.submissions[0].feedback.score }}/{{ item.maxScore }}</p></div>
            <ArrowRight :size="19" class="text-purple-600" />
          </div>
        </RouterLink>
      </section>

      <section v-else-if="!api.loading.value" class="mt-5 grid min-h-72 place-items-center border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <div><ClipboardList :size="44" class="mx-auto text-slate-400" /><h2 class="mt-4 text-xl font-black">Chưa có bài tập</h2><p class="mt-2 text-sm text-slate-500">Giảng viên chưa giao bài tập cho khóa học này.</p><RouterLink :to="`/learn/${courseId}`"><BaseButton class="mt-5">Tiếp tục học</BaseButton></RouterLink></div>
      </section>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.assignments-page{padding-top:.75rem!important}
.grade-summary{display:grid;gap:1.5rem;border-block:1px solid var(--border);padding:1.25rem 0;background:transparent;color:var(--text)}@media(min-width:640px){.grade-summary{grid-template-columns:1fr auto;align-items:center}}
.grade-breakdown{border-left:2px solid var(--border);padding:.5rem 1rem;background:transparent}.grade-breakdown p{font-size:.75rem;font-weight:700;color:var(--text-muted)}.grade-breakdown b{display:block;margin-top:.2rem;font-size:1.75rem;color:var(--text)}.grade-breakdown span{display:block;margin-top:.15rem;font-size:.7rem;color:var(--text-muted)}
.metric-card{display:flex;align-items:center;justify-content:space-between;background:var(--surface);padding:1rem}.metric-card b{font-size:1.5rem}.metric-card span{font-size:.8rem;color:var(--text-muted);font-weight:700}
.assignment-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--border);padding:1rem;transition:background .18s}.assignment-row:last-child{border-bottom:0}.assignment-row:hover{background:var(--surface-muted)}
@media(max-width:639px){.assignment-row{flex-direction:column}.assignment-row>div:last-child{width:100%;justify-content:space-between;text-align:left}}
</style>
