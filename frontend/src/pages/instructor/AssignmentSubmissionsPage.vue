<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import InstructorLayout from "@/layouts/InstructorLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseTextarea from "@/components/ui/BaseTextarea.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type {
  ApiResponse,
  Assignment,
  AssignmentSubmission,
  SubmissionFile,
} from "@/types";

const route = useRoute(),
  api = useApi(),
  assignmentId = String(route.params.assignmentId),
  assignment = ref<Assignment | null>(null),
  items = ref<AssignmentSubmission[]>([]),
  error = ref(""),
  message = ref(""),
  savingId = ref(""),
  previewFile = ref<SubmissionFile | null>(null),
  previewUrl = ref(""),
  previewLoading = ref(false);
const drafts = reactive<Record<string, { score: string; comment: string }>>({});
const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN");
const fileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
async function load() {
  error.value = "";
  try {
    const [detail, list] = await Promise.all([
      api.get<ApiResponse<Assignment>>(`/assignments/${assignmentId}`),
      api.get<ApiResponse<AssignmentSubmission[]>>(
        `/assignments/${assignmentId}/submissions`,
      ),
    ]);
    assignment.value = detail.data || null;
    items.value = list.data || [];
    for (const item of items.value)
      drafts[item.id] = {
        score: item.feedback ? String(item.feedback.score) : "",
        comment: item.feedback?.comment || "",
      };
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "Không thể tải danh sách bài nộp";
  }
}
function preventNegativeScore(event: KeyboardEvent) {
  if (event.key === "-" || event.key === "e" || event.key === "E") {
    event.preventDefault();
  }
}

function handleScoreInput(itemId: string, event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const val = inputEl.value;
  if (!val) return;
  const num = parseFloat(val);
  const max = Number(assignment.value?.maxScore || 100);
  if (num < 0) {
    drafts[itemId].score = "0";
    inputEl.value = "0";
  } else if (num > max) {
    drafts[itemId].score = String(max);
    inputEl.value = String(max);
  }
}

async function grade(item: AssignmentSubmission) {
  const rawScore = drafts[item.id]?.score;
  const score = Number(rawScore);
  const maxScore = Number(assignment.value?.maxScore || 100);

  if (rawScore === "" || rawScore === null || rawScore === undefined || !Number.isFinite(score)) {
    error.value = "Vui lòng nhập điểm hợp lệ.";
    return;
  }
  if (score < 0) {
    error.value = "Điểm số không được là số âm (phải từ 0 trở lên).";
    return;
  }
  if (score > maxScore) {
    error.value = `Điểm số không được vượt quá thang điểm tối đa (${maxScore}).`;
    return;
  }
  savingId.value = item.id;
  error.value = "";
  try {
    await api.patch(`/submissions/${item.id}/grade`, {
      score,
      comment: drafts[item.id]?.comment.trim() || null,
    });
    message.value = `Đã lưu điểm cho ${item.student?.fullName || "học viên"}.`;
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Không thể chấm bài";
  } finally {
    savingId.value = "";
  }
}
async function download(file: SubmissionFile) {
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
function closePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  previewFile.value = null;
}
async function preview(file: SubmissionFile) {
  if (file.mimeType !== "application/pdf" && !file.originalName.toLowerCase().endsWith(".pdf")) {
    await download(file);
    return;
  }
  closePreview();
  previewFile.value = file;
  previewLoading.value = true;
  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(file.fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error("Không thể mở file PDF");
    previewUrl.value = URL.createObjectURL(await response.blob());
  } catch (cause) {
    closePreview();
    error.value = cause instanceof Error ? cause.message : "Không thể mở file PDF";
  } finally {
    previewLoading.value = false;
  }
}
onMounted(load);
onBeforeUnmount(closePreview);
</script>

<template>
  <InstructorLayout
    ><main class="mx-auto max-w-6xl">
      <header>
        <button
          class="text-sm font-bold text-purple-600"
          @click="$router.back()"
        >
          ← Danh sách bài tập
        </button>
        <p
          class="mt-4 text-sm font-bold uppercase tracking-wider text-purple-600"
        >
          Chấm điểm
        </p>
        <h1 class="app-page-title mt-2">
          {{ assignment?.title || "Bài nộp của học viên" }}
        </h1>
        <p class="app-page-description">
          {{ items.length }} lượt nộp · Điểm tối đa
          {{ assignment?.maxScore || 0 }}
        </p>
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
      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <section v-else-if="items.length" class="mt-7 space-y-5">
        <article
          v-for="item in items"
          :key="item.id"
          class="surface-card overflow-hidden"
        >
          <header
            class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800"
          >
            <div class="flex items-center gap-3">
              <span
                class="grid h-11 w-11 place-items-center rounded-full bg-purple-100 font-black text-purple-700"
                >{{ item.student?.fullName?.slice(0, 1) || "H" }}</span
              >
              <div>
                <h2 class="font-black">{{ item.student?.fullName }}</h2>
                <p class="text-xs text-slate-500">
                  {{ item.student?.email }} · Lần nộp {{ item.attemptNumber }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-bold',
                  item.feedback
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700',
                ]"
                >{{ item.feedback ? "Đã chấm" : "Chờ chấm" }}</span
              >
              <p class="mt-2 text-xs text-slate-500">
                {{ formatDate(item.submittedAt) }}
              </p>
            </div>
          </header>
          <div class="grid gap-6 p-6 lg:grid-cols-[1fr_22rem]">
            <div>
              <h3
                class="text-sm font-black uppercase tracking-wider text-slate-400"
              >
                Nội dung bài làm
              </h3>
              <p
                class="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 dark:bg-slate-800/50"
              >
                {{ item.textContent || "Học viên chỉ nộp file." }}
              </p>
              <div v-if="item.files.length" class="mt-4 space-y-2">
                <button
                  v-for="file in item.files"
                  :key="file.id"
                  class="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-purple-300 dark:border-slate-700"
                  @click="preview(file)"
                >
                  <span class="font-semibold">📎 {{ file.originalName }}</span
                  ><span class="text-xs text-slate-400"
                    >{{ fileSize(file.sizeBytes) }} · {{ file.mimeType === "application/pdf" || file.originalName.toLowerCase().endsWith(".pdf") ? "Xem PDF" : "Tải xuống" }}</span
                  >
                </button>
              </div>
            </div>
            <form
              class="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-900 dark:bg-purple-950/20"
              @submit.prevent="grade(item)"
            >
              <h3 class="font-black">Điểm và nhận xét</h3>
              <BaseInput
                :id="`score-${item.id}`"
                v-model="drafts[item.id].score"
                class="mt-4"
                type="number"
                min="0"
                :max="assignment?.maxScore || 100"
                step="0.01"
                :label="`Điểm (Thang 0 đến ${assignment?.maxScore || 100})`"
                placeholder="Nhập điểm số (0 - 100)"
                required
                @keydown="preventNegativeScore"
                @input="handleScoreInput(item.id, $event)"
              /><BaseTextarea
                :id="`comment-${item.id}`"
                v-model="drafts[item.id].comment"
                class="mt-4"
                label="Nhận xét"
                :rows="4"
              /><BaseButton
                class="mt-4"
                type="submit"
                :full-width="true"
                :loading="savingId === item.id"
                >{{
                  item.feedback ? "Cập nhật điểm" : "Hoàn tất chấm bài"
                }}</BaseButton
              >
            </form>
          </div>
        </article>
      </section>
      <section
        v-else-if="!api.loading.value"
        class="surface-card mt-7 grid min-h-72 place-items-center p-8 text-center"
      >
        <div>
          <span class="text-5xl">📭</span>
          <h2 class="mt-4 text-xl font-black">Chưa có bài nộp</h2>
          <p class="mt-2 text-sm text-slate-500">
            Bài của học viên sẽ xuất hiện tại đây.
          </p>
        </div>
      </section>
      <BaseModal :show="Boolean(previewFile)" :title="previewFile?.originalName || 'Xem bài nộp PDF'" size="xl" @close="closePreview">
        <div v-if="previewLoading" class="grid min-h-96 place-items-center"><LoadingSpinner /></div>
        <iframe v-else-if="previewUrl" :src="previewUrl" class="h-[70vh] w-full rounded-xl border border-slate-200" title="Xem trước bài nộp PDF" />
        <div class="mt-4 flex justify-end gap-3"><BaseButton v-if="previewFile" variant="secondary" @click="download(previewFile)">Tải xuống</BaseButton><BaseButton @click="closePreview">Đóng</BaseButton></div>
      </BaseModal>
    </main></InstructorLayout
  >
</template>
