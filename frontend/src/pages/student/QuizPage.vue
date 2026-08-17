<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { useApi } from "@/composables/useApi";
import type { ApiResponse, Quiz, QuizAttempt, QuizResult } from "@/types";

const route = useRoute();
const router = useRouter();
const api = useApi();
const quizId = String(route.params.quizId);
const quiz = ref<Quiz | null>(null);
const attempts = ref<QuizAttempt[]>([]);
const attempt = ref<QuizAttempt | null>(null);
const answers = ref<Record<string, string>>({});
const error = ref("");
const backToCourse = () =>
  String(route.query.courseId || quiz.value?.courseId || "");

async function load() {
  try {
    const [quizResponse, attemptResponse] = await Promise.all([
      api.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`),
      api.get<ApiResponse<QuizAttempt[]>>(`/quizzes/${quizId}/attempts/me`),
    ]);
    quiz.value = quizResponse.data || null;
    attempts.value = attemptResponse.data || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không tải được bài kiểm tra";
  }
}

async function start() {
  try {
    const response = await api.post<ApiResponse<QuizAttempt>>(
      `/quizzes/${quizId}/attempts`,
    );
    attempt.value = response.data || null;
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không bắt đầu được bài làm";
  }
}

async function submit() {
  if (!quiz.value || !attempt.value) return;
  if (Object.keys(answers.value).length !== quiz.value.questions?.length) {
    error.value = "Vui lòng trả lời tất cả câu hỏi";
    return;
  }
  try {
    const response = await api.post<ApiResponse<QuizResult>>(
      `/quiz-attempts/${attempt.value.id}/submit`,
      {
        answers: Object.entries(answers.value).map(
          ([questionId, optionId]) => ({ questionId, optionId }),
        ),
      },
    );
    sessionStorage.setItem("quizResult", JSON.stringify(response.data));
    await router.push({
      path: "/quiz-result",
      query: backToCourse() ? { courseId: backToCourse() } : {},
    });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không nộp được bài";
  }
}

onMounted(load);
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-3xl px-4 py-10">
      <RouterLink
        v-if="backToCourse()"
        :to="`/learn/${backToCourse()}`"
        class="mb-6 inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
        >← Quay lại khóa học</RouterLink
      >
      <p
        v-if="error"
        class="mb-4 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/30 dark:text-red-300"
      >
        {{ error }}
      </p>
      <div v-if="quiz" class="space-y-6">
        <header>
          <h1 class="text-3xl font-extrabold">{{ quiz.title }}</h1>
          <p class="mt-2 text-slate-500">
            Điểm đạt {{ quiz.passingScore }}% · Tối đa
            {{ quiz.maxAttempts }} lần · Đã làm {{ attempts.length }} lần
          </p>
        </header>
        <div
          v-if="!attempt"
          class="rounded-2xl border bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <p class="mb-5">
            Khi bắt đầu, hệ thống sẽ ghi nhận một lượt làm bài.
          </p>
          <BaseButton @click="start">Bắt đầu làm bài</BaseButton>
        </div>
        <form v-else class="space-y-4" @submit.prevent="submit">
          <article
            v-for="(question, index) in quiz.questions"
            :key="question.id"
            class="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 class="font-bold">
              Câu {{ index + 1 }}: {{ question.text }}
              <span class="text-sm text-slate-400"
                >({{ question.points }} điểm)</span
              >
            </h2>
            <label
              v-for="option in question.options"
              :key="option.id"
              class="mt-3 flex cursor-pointer gap-3 rounded-xl border p-3"
              :class="
                answers[question.id] === option.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                  : ''
              "
              ><input
                v-model="answers[question.id]"
                type="radio"
                :name="question.id"
                :value="option.id"
              /><span>{{ option.text }}</span></label
            >
          </article>
          <BaseButton class="w-full" type="submit"
            >Nộp bài và chấm điểm</BaseButton
          >
        </form>
      </div>
    </main>
  </DefaultLayout>
</template>
