<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { API_BASE_URL } from "@/composables/useApi";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    currentUrl?: string | null;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    currentUrl: null,
    required: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  change: [file: File | null];
  error: [message: string];
}>();

const input = ref<HTMLInputElement | null>(null);
const fileName = ref("");
const objectUrl = ref<string | null>(null);
const previewUrl = computed(() => {
  const value = objectUrl.value || props.currentUrl;
  if (!value || value.startsWith("http") || value.startsWith("blob:"))
    return value || null;
  return `${API_BASE_URL.replace("/api/v1", "")}${value}`;
});

function revokePreview() {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = null;
}

function choose(event: Event) {
  const element = event.target as HTMLInputElement;
  const file = element.files?.[0] || null;
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    element.value = "";
    emit("error", "Ảnh phải có định dạng JPG, PNG hoặc WebP");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    element.value = "";
    emit("error", "Ảnh không được vượt quá 5 MB");
    return;
  }
  revokePreview();
  objectUrl.value = URL.createObjectURL(file);
  fileName.value = file.name;
  emit("change", file);
}

function clearSelection() {
  revokePreview();
  fileName.value = "";
  if (input.value) input.value.value = "";
  emit("change", null);
}

onBeforeUnmount(revokePreview);
</script>

<template>
  <div class="space-y-2">
    <label
      :for="id"
      class="block text-sm font-semibold text-slate-700 dark:text-slate-200"
    >
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div
      class="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50/40 dark:border-slate-700 dark:bg-slate-950/30 dark:hover:border-purple-700 dark:hover:bg-purple-950/10 sm:flex-row sm:items-center"
    >
      <div
        class="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 sm:w-40"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Xem trước ảnh"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex flex-col items-center gap-2 text-slate-400">
          <svg
            class="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.6"
              d="m4 16 4.59-4.59a2 2 0 0 1 2.82 0L16 16m-2-2 1.59-1.59a2 2 0 0 1 2.82 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
            />
          </svg>
          <span class="text-xs font-medium">Chưa có ảnh</span>
        </div>
      </div>

      <div class="min-w-0 flex-1 space-y-2.5">
        <input
          :id="id"
          ref="input"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          :required="required && !currentUrl"
          :disabled="disabled"
          @change="choose"
        />
        <div class="flex flex-wrap items-center gap-2">
          <label
            :for="id"
            :class="[
              'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3.5 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50',
              disabled ? 'pointer-events-none opacity-50' : '',
            ]"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 16V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
              />
            </svg>
            {{ previewUrl ? "Thay ảnh" : "Chọn ảnh" }}
          </label>
          <button
            v-if="fileName"
            type="button"
            class="min-h-10 rounded-xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            @click="clearSelection"
          >
            Bỏ chọn
          </button>
        </div>
        <p
          v-if="fileName"
          class="truncate text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {{ fileName }}
        </p>
        <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">
          JPG, PNG hoặc WebP · tối đa 5 MB
        </p>
      </div>
    </div>
  </div>
</template>
