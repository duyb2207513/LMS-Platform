<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type {
  AdminListResponse,
  ApiResponse,
  User,
  UserRole,
  UserStatus,
} from "@/types";

const api = useApi(),
  users = ref<User[]>([]),
  search = ref(""),
  role = ref(""),
  status = ref(""),
  error = ref("");
async function load() {
  try {
    const response = await api.get<AdminListResponse<User>>("/admin/users", {
      search: search.value,
      role: role.value,
      status: status.value,
      limit: 100,
    });
    users.value = response.data?.items || [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Không thể tải người dùng";
  }
}
async function update(
  user: User,
  data: { role?: UserRole; status?: UserStatus },
) {
  try {
    const response = await api.patch<ApiResponse<User>>(
      `/admin/users/${user.id}`,
      data,
    );
    if (response.data) Object.assign(user, response.data);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Không thể cập nhật");
  }
}
onMounted(load);
</script>
<template>
  <AdminLayout
    ><div class="max-w-7xl">
      <div class="mb-7">
        <h1 class="text-3xl font-extrabold dark:text-white">
          Quản lý người dùng
        </h1>
        <p class="text-slate-500 mt-2">
          Tìm kiếm, phân quyền và khóa tài khoản
        </p>
      </div>
      <div class="filters">
        <input
          v-model="search"
          @keyup.enter="load"
          placeholder="Tên hoặc email..."
        /><select v-model="role" @change="load">
          <option value="">Tất cả vai trò</option>
          <option>STUDENT</option>
          <option>INSTRUCTOR</option>
          <option>ADMIN</option></select
        ><select v-model="status" @change="load">
          <option value="">Tất cả trạng thái</option>
          <option>ACTIVE</option>
          <option>BLOCKED</option></select
        ><button @click="load">Tìm kiếm</button>
      </div>
      <LoadingSpinner v-if="api.loading.value" />
      <p v-else-if="error" class="text-red-600">{{ error }}</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <b>{{ user.fullName }}</b
                ><small>{{ user.email }}</small>
              </td>
              <td>
                <select
                  :value="user.role"
                  @change="
                    update(user, {
                      role: ($event.target as HTMLSelectElement)
                        .value as UserRole,
                    })
                  "
                >
                  <option>STUDENT</option>
                  <option>INSTRUCTOR</option>
                  <option>ADMIN</option>
                </select>
              </td>
              <td>
                <button
                  class="status"
                  :class="user.status"
                  @click="
                    update(user, {
                      status:
                        user.status === 'ACTIVE'
                          ? ('BLOCKED' as UserStatus)
                          : ('ACTIVE' as UserStatus),
                    })
                  "
                >
                  {{ user.status }}
                </button>
              </td>
              <td>
                {{ new Date(user.createdAt).toLocaleDateString("vi-VN") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div></AdminLayout
  >
</template>
<style scoped>
@reference "../../assets/main.css";
.filters {
  @apply flex flex-wrap gap-3 mb-6;
}
.filters input,
.filters select,
td select {
  @apply bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 dark:text-white;
}
.filters button {
  @apply bg-indigo-600 text-white rounded-xl px-5 font-bold;
}
.table-wrap {
  @apply overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800;
}
table {
  @apply w-full;
}
th,
td {
  @apply text-left px-5 py-4 border-b border-slate-100 dark:border-slate-800 dark:text-slate-200;
}
th {
  @apply text-xs uppercase text-slate-500;
}
small {
  @apply block text-slate-400 mt-1;
}
.status {
  @apply px-3 py-1 rounded-lg text-xs font-bold;
}
.ACTIVE {
  @apply bg-emerald-100 text-emerald-700;
}
.BLOCKED {
  @apply bg-red-100 text-red-700;
}
</style>
