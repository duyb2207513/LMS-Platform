<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type {
  AdminListResponse,
  ApiResponse,
  Course,
  CourseStatus,
} from "@/types";
const api = useApi(),
  items = ref<Course[]>([]),
  search = ref(""),
  status = ref(""),
  error = ref("");
async function load() {
  try {
    const r = await api.get<AdminListResponse<Course>>("/admin/courses", {
      search: search.value,
      status: status.value,
      limit: 100,
    });
    items.value = r.data?.items || [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Không thể tải khóa học";
  }
}
async function update(item: Course, next: CourseStatus) {
  try {
    const r = await api.patch<ApiResponse<Course>>(
      `/admin/courses/${item.id}`,
      { status: next },
    );
    if (r.data) Object.assign(item, r.data);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Không thể cập nhật");
  }
}
onMounted(load);
const money = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + " ₫";
</script>
<template>
  <AdminLayout
    ><div class="max-w-7xl">
      <h1 class="title">Quản lý khóa học</h1>
      <p class="sub">Kiểm duyệt và thay đổi trạng thái xuất bản</p>
      <div class="filters">
        <input
          v-model="search"
          @keyup.enter="load"
          placeholder="Tên khóa học..."
        /><select v-model="status" @change="load">
          <option value="">Mọi trạng thái</option>
          <option>DRAFT</option>
          <option>PUBLISHED</option>
          <option>ARCHIVED</option></select
        ><button @click="load">Tìm kiếm</button>
      </div>
      <LoadingSpinner v-if="api.loading.value" />
      <p v-else-if="error" class="text-red-600">{{ error }}</p>
      <div v-else class="grid lg:grid-cols-2 gap-4">
        <div v-for="course in items" :key="course.id" class="card">
          <div>
            <span class="badge">{{ course.status }}</span>
            <h2>{{ course.title }}</h2>
            <p>
              {{ course.instructor?.fullName }} · {{ course.category?.name }}
            </p>
            <b>{{ course.isFree ? "Miễn phí" : money(course.price) }}</b>
          </div>
          <select
            :value="course.status"
            @change="
              update(
                course,
                ($event.target as HTMLSelectElement).value as CourseStatus,
              )
            "
          >
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </select>
        </div>
      </div>
    </div></AdminLayout
  >
</template>
<style scoped>
@reference "../../assets/main.css";
.title {
  @apply text-3xl font-extrabold dark:text-white;
}
.sub {
  @apply text-slate-500 mt-2 mb-6;
}
.filters {
  @apply flex gap-3 flex-wrap mb-6;
}
.filters input,
.filters select,
.card select {
  @apply bg-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2;
}
.filters button {
  @apply bg-indigo-600 text-white rounded-xl px-5 font-bold;
}
.card {
  @apply bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex justify-between gap-4 items-center;
}
.card h2 {
  @apply font-bold text-lg dark:text-white mt-3;
}
.card p {
  @apply text-sm text-slate-500 my-2;
}
.badge {
  @apply text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg;
}
</style>
