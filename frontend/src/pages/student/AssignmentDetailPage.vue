<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseTextarea from "@/components/ui/BaseTextarea.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { ApiResponse, Assignment, SubmissionFile } from "@/types";

const route = useRoute(),
  api = useApi(),
  assignmentId = String(route.params.assignmentId),
  item = ref<Assignment | null>(null),
  textContent = ref(""),
  files = ref<File[]>([]),
  error = ref(""),
  message = ref(""),
  submitting = ref(false),
  fileKey = ref(0);
const attempts = computed(() => item.value?.submissions || []);
const latestAttempt = computed(() => attempts.value[0] || null);
const canSubmit = computed(() =>
  Boolean(
    item.value &&
    (!item.value.isOverdue || item.value.allowLateSubmissions) &&
    (item.value.remainingSubmissions ?? 0) > 0,
  ),
);
const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN"),
  fileSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
async function load() {
  try {
    const response = await api.get<ApiResponse<Assignment>>(
      `/assignments/${assignmentId}`,
    );
    item.value = response.data || null;
    if (item.value) {
      item.value.isOverdue = new Date(item.value.dueAt) < new Date();
      item.value.remainingSubmissions = Math.max(
        0,
        item.value.maxSubmissions - (item.value.submissions?.length || 0),
      );
    }
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể tải bài tập";
  }
}
function choose(event: Event) {
  const selected = Array.from((event.target as HTMLInputElement).files || []);
  if (selected.length > 5) {
    error.value = "Chỉ được chọn tối đa 5 file.";
    return;
  }
  if (selected.some((file) => file.size > 20 * 1024 * 1024)) {
    error.value = "Mỗi file không được vượt quá 20 MB.";
    return;
  }
  files.value = selected;
  error.value = "";
}
async function submit() {
  submitting.value = true;
  error.value = "";
  try {
    const form = new FormData();
    if (textContent.value.trim())
      form.append("textContent", textContent.value.trim());
    for (const file of files.value) form.append("files", file);
    await api.post(`/assignments/${assignmentId}/submissions`, form);
    message.value =
      "Nộp bài thành công. Giảng viên sẽ chấm và gửi nhận xét tại đây.";
    textContent.value = "";
    files.value = [];
    fileKey.value++;
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể nộp bài";
  } finally {
    submitting.value = false;
  }
}
async function download(file: Pick<SubmissionFile, "fileUrl" | "originalName">) {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(file.fileUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Không thể tải file");
    const blob = await response.blob(),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = file.originalName;
    link.click();
    URL.revokeObjectURL(url);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể tải file";
  }
}
function prepareResubmission() {
  if (!canSubmit.value || !latestAttempt.value) return;
  textContent.value = latestAttempt.value.textContent || "";
  files.value = [];
  fileKey.value++;
  message.value = `Đã sao chép nội dung lần nộp gần nhất. Bạn còn ${item.value?.remainingSubmissions} lần chỉnh sửa & nộp lại (tối đa ${item.value?.maxSubmissions || 3} lần).`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function editAttempt(attempt: { textContent?: string | null }) {
  if (!canSubmit.value) return;
  textContent.value = attempt.textContent || "";
  files.value = [];
  fileKey.value++;
  message.value = `Đã lấy nội dung lần nộp để chỉnh sửa. Hãy cập nhật rồi bấm nút Nộp lại. (Còn lại ${item.value?.remainingSubmissions} lần nộp, tối đa ${item.value?.maxSubmissions || 3} lần).`;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
onMounted(load);
</script>

<template>
  <DefaultLayout
    ><main class="app-page max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <RouterLink
        v-if="item"
        :to="`/courses/${item.courseId}/assignments`"
        class="text-sm font-bold text-purple-600"
        >← Bài tập và điểm</RouterLink
      ><LoadingSpinner
        v-if="api.loading.value && !item"
        class="py-24"
      /><template v-else-if="item"
        ><header
          class="mt-5 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 p-7 text-white shadow-xl sm:p-9"
        >
          <div class="flex flex-wrap items-start justify-between gap-5">
            <div class="max-w-2xl">
              <p
                class="text-sm font-bold uppercase tracking-wider text-purple-300"
              >
                Assignment · {{ item.maxScore }} điểm
              </p>
              <h1 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {{ item.title }}
              </h1>
              <p class="mt-4 leading-7 text-slate-300">
                {{
                  item.description ||
                  "Hoàn thành bài tập theo hướng dẫn của giảng viên."
                }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/10 p-4 text-right">
              <p class="text-xs text-purple-200">Hạn nộp</p>
              <b class="mt-1 block">{{ formatDate(item.dueAt) }}</b
              ><span
                :class="[
                  'mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold',
                  item.isOverdue
                    ? 'bg-red-400/20 text-red-200'
                    : 'bg-emerald-400/20 text-emerald-200',
                ]"
                >{{ item.isOverdue ? "Đã quá hạn" : "Đang nhận bài" }}</span
              >
            </div>
          </div>
        </header>
        <p
          v-if="message"
          class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {{ message }}
        </p>
        <p
          v-if="error"
          class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
        >
          {{ error }}
        </p>
        <div class="mt-7 grid gap-7 lg:grid-cols-[1fr_22rem]">
          <div class="space-y-6">
            <section class="surface-card p-6">
              <h2 class="text-xl font-black">Hướng dẫn thực hiện</h2>
              <p
                class="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300"
              >
                {{
                  item.instructions ||
                  "Giảng viên chưa bổ sung hướng dẫn chi tiết."
                }}
              </p>
              <div v-if="item.attachments?.length" class="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"><h3 class="text-sm font-black">Tài liệu đính kèm</h3><button v-for="file in item.attachments" :key="file.id" type="button" class="mt-2 flex w-full items-center justify-between border border-slate-200 px-3 py-2 text-left text-sm hover:border-purple-400 dark:border-slate-700" @click="download(file)"><span class="truncate font-semibold">{{ file.originalName }}</span><span class="ml-3 shrink-0 text-xs text-slate-400">{{ fileSize(file.sizeBytes) }} · Tải xuống</span></button></div>
            </section>
            <section class="surface-card p-6">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-xl font-black">Lịch sử nộp bài</h2>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ attempts.length }}/{{ item.maxSubmissions }} lần đã sử
                    dụng
                  </p>
                </div>
              </div>
              <div v-if="attempts.length" class="mt-5 space-y-4">
                <article
                  v-for="attempt in attempts"
                  :key="attempt.id"
                  class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <b>Lần nộp {{ attempt.attemptNumber }}</b>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ formatDate(attempt.submittedAt) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        :class="[
                          'rounded-full px-2.5 py-1 text-xs font-bold',
                          attempt.feedback
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                        ]"
                        >{{
                          attempt.feedback
                            ? `${attempt.feedback.score}/${item.maxScore} điểm`
                            : "Đang chờ chấm"
                        }}</span
                      >
                      <button
                        v-if="canSubmit"
                        type="button"
                        class="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        title="Chỉnh sửa nội dung lần nộp này"
                        @click="editAttempt(attempt)"
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="attempt.textContent"
                    class="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 dark:bg-slate-800"
                  >
                    {{ attempt.textContent }}
                  </p>
                  <div
                    v-if="attempt.files.length"
                    class="mt-3 flex flex-wrap gap-2"
                  >
                    <button
                      v-for="file in attempt.files"
                      :key="file.id"
                      class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-purple-300 dark:border-slate-700"
                      @click="download(file)"
                    >
                      📎 {{ file.originalName }} ·
                      {{ fileSize(file.sizeBytes) }}
                    </button>
                  </div>
                  <div
                    v-if="attempt.feedback"
                    class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
                  >
                    <p
                      class="text-xs font-black uppercase tracking-wider text-emerald-700"
                    >
                      Nhận xét của giảng viên
                    </p>
                    <p
                      class="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-200"
                    >
                      {{
                        attempt.feedback.comment || "Không có nhận xét thêm."
                      }}
                    </p>
                  </div>
                </article>
              </div>
              <p
                v-else
                class="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800/50"
              >
                Bạn chưa nộp bài lần nào.
              </p>
            </section>
          </div>
          <aside class="surface-card h-fit p-6 lg:sticky lg:top-24">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-black">{{ attempts.length ? "Chỉnh sửa & nộp lại" : "Nộp bài" }}</h2>
              <button v-if="attempts.length && canSubmit" type="button" class="text-xs font-bold text-purple-600 hover:text-purple-700" @click="prepareResubmission">Dùng bản gần nhất</button>
            </div>
            <p class="mt-1 text-sm text-slate-500">
              {{ attempts.length ? "Mỗi lần nộp lại được lưu thành một phiên bản riêng để không mất lịch sử." : "Có thể gửi nội dung văn bản, file hoặc cả hai." }}
            </p>
            <form
              v-if="canSubmit"
              class="mt-5 space-y-4"
              @submit.prevent="submit"
            >
              <BaseTextarea
                id="submission-text"
                v-model="textContent"
                label="Nội dung bài làm"
                placeholder="Nhập câu trả lời hoặc ghi chú cho giảng viên..."
                :rows="7"
              />
              <div>
                <label class="block text-sm font-semibold">File đính kèm</label
                ><input
                  :key="fileKey"
                  class="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:font-bold file:text-purple-700"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
                  @change="choose"
                />
                <p class="mt-2 text-xs leading-5 text-slate-400">
                  Tối đa 5 file, 20 MB/file và 50 MB tổng cộng.
                </p>
              </div>
              <ul v-if="files.length" class="space-y-1 text-xs text-slate-600">
                <li v-for="file in files" :key="file.name">
                  • {{ file.name }} ({{ fileSize(file.size) }})
                </li>
              </ul>
              <BaseButton
                type="submit"
                :full-width="true"
                :loading="submitting"
                >{{ attempts.length ? `Chỉnh sửa & Nộp lại (Lần ${attempts.length + 1}/${item.maxSubmissions})` : "Nộp bài" }}</BaseButton
              >
            </form>
            <div
              v-else
              class="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
            >
              <template v-if="item.isOverdue && !item.allowLateSubmissions"
                >⏰ Đã hết hạn nộp bài.</template
              ><template v-else>⚠️ Bạn đã sử dụng hết tối đa {{ item.maxSubmissions }} lần nộp/chỉnh sửa bài tập.</template>
            </div>
            <dl
              class="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm dark:border-slate-800"
            >
              <div class="flex justify-between">
                <dt class="text-slate-500">Nộp lại</dt>
                <dd class="font-bold">
                  {{ item.allowResubmission ? "Có" : "Không" }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Còn lại</dt>
                <dd class="font-bold">{{ item.remainingSubmissions }} lần</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Nộp trễ</dt>
                <dd class="font-bold">
                  {{ item.allowLateSubmissions ? "Cho phép" : "Không" }}
                </dd>
              </div>
            </dl>
          </aside>
        </div></template
      >
    </main></DefaultLayout
  >
</template>
