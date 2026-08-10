<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { AdminListResponse, AdminReview } from "@/types";
const api = useApi(),
  items = ref<AdminReview[]>([]),
  search = ref(""),
  error = ref("");
async function load() {
  try {
    const r = await api.get<AdminListResponse<AdminReview>>("/admin/reviews", {
      search: search.value,
      limit: 100,
    });
    items.value = r.data?.items || [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Không thể tải đánh giá";
  }
}
async function remove(id: string) {
  if (!confirm("Xóa đánh giá này?")) return;
  try {
    await api.del(`/admin/reviews/${id}`);
    items.value = items.value.filter((x) => x.id !== id);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Không thể xóa");
  }
}
onMounted(load);
</script>
<template>
  <AdminLayout
    ><div class="max-w-6xl">
      <h1 class="title">Kiểm duyệt đánh giá</h1>
      <div class="search">
        <input
          v-model="search"
          @keyup.enter="load"
          placeholder="Học viên, khóa học, nội dung..."
        /><button @click="load">Tìm</button>
      </div>
      <LoadingSpinner v-if="api.loading.value" />
      <p v-else-if="error" class="text-red-600">{{ error }}</p>
      <div v-else>
        <article v-for="item in items" :key="item.id" class="card">
          <div class="flex-1">
            <div class="flex justify-between">
              <b>{{ item.user.fullName }}</b
              ><span class="stars"
                >{{ "★".repeat(item.rating)
                }}{{ "☆".repeat(5 - item.rating) }}</span
              >
            </div>
            <p class="course">{{ item.course.title }}</p>
            <p>{{ item.content || "Không có nhận xét" }}</p>
          </div>
          <button class="delete" @click="remove(item.id)">Xóa</button>
        </article>
      </div>
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
.course {
  @apply text-sm text-indigo-600 font-semibold my-2;
}
.stars {
  @apply text-amber-500;
}
.delete {
  @apply text-red-600 font-bold;
}
</style>
