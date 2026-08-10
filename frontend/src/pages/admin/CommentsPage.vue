<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { AdminComment, AdminListResponse } from "@/types";
const api = useApi(),
  items = ref<AdminComment[]>([]),
  search = ref(""),
  error = ref("");
async function load() {
  try {
    const r = await api.get<AdminListResponse<AdminComment>>(
      "/admin/comments",
      { search: search.value, limit: 100 },
    );
    items.value = r.data?.items || [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Không thể tải bình luận";
  }
}
async function remove(id: string) {
  if (!confirm("Ẩn bình luận này?")) return;
  try {
    await api.del(`/admin/comments/${id}`);
    const x = items.value.find((v) => v.id === id);
    if (x) {
      x.isDeleted = true;
      x.content = null;
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "Không thể ẩn");
  }
}
onMounted(load);
</script>
<template>
  <AdminLayout
    ><div class="max-w-6xl">
      <h1 class="title">Kiểm duyệt bình luận</h1>
      <div class="search">
        <input
          v-model="search"
          @keyup.enter="load"
          placeholder="Người dùng, bài học, nội dung..."
        /><button @click="load">Tìm</button>
      </div>
      <LoadingSpinner v-if="api.loading.value" />
      <p v-else-if="error" class="text-red-600">{{ error }}</p>
      <article v-for="item in items" :key="item.id" class="card">
        <div class="flex-1">
          <b>{{ item.user.fullName }}</b>
          <p class="path">
            {{ item.lesson.section.course.title }} / {{ item.lesson.title }}
          </p>
          <p :class="{ 'italic text-slate-400': item.isDeleted }">
            {{ item.isDeleted ? "Bình luận đã bị xóa" : item.content }}
          </p>
        </div>
        <button v-if="!item.isDeleted" class="delete" @click="remove(item.id)">
          Ẩn
        </button>
      </article>
    </div></AdminLayout
  >
</template>
<style scoped>
@reference "../../assets/main.css";
.title {
  @apply text-3xl font-extrabold dark:text-white mb-6;
}
.search {
  @apply flex gap-3 mb-6;
}
.search input {
  @apply flex-1 bg-white dark:bg-slate-900 dark:text-white border rounded-xl px-4;
}
.search button {
  @apply bg-indigo-600 text-white rounded-xl px-6 py-3 font-bold;
}
.card {
  @apply flex gap-5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl border dark:border-slate-800 p-5 mb-3;
}
.path {
  @apply text-xs text-indigo-600 font-semibold my-2;
}
.delete {
  @apply text-red-600 font-bold;
}
</style>
