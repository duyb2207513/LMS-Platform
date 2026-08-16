<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { AdminListResponse, ApiResponse, User, UserRole, UserStatus } from '@/types'

const api = useApi()
const users = ref<User[]>([])
const search = ref('')
const role = ref('')
const status = ref('')
const providerFilter = ref('')
const error = ref('')
const message = ref('')
const updatingId = ref('')

const activeCount = computed(() => users.value.filter((u) => u.status === 'ACTIVE').length)
const googleCount = computed(() => users.value.filter((u) => u.googleId).length)
const githubCount = computed(() => users.value.filter((u) => u.githubId).length)
const emailCount = computed(() => users.value.filter((u) => !u.googleId && !u.githubId).length)

const filteredUsers = computed(() => {
  if (!providerFilter.value) return users.value
  if (providerFilter.value === 'GOOGLE') return users.value.filter((u) => u.googleId)
  if (providerFilter.value === 'GITHUB') return users.value.filter((u) => u.githubId)
  if (providerFilter.value === 'EMAIL') return users.value.filter((u) => !u.googleId && !u.githubId)
  return users.value
})

async function load() {
  error.value = ''
  try {
    const response = await api.get<AdminListResponse<User>>('/admin/users', {
      search: search.value.trim(),
      role: role.value,
      status: status.value,
      limit: 100,
    })
    users.value = response.data?.items || []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải người dùng'
  }
}

async function update(user: User, data: { role?: UserRole; status?: UserStatus }) {
  updatingId.value = user.id
  error.value = ''
  message.value = ''
  try {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${user.id}`, data)
    if (response.data) Object.assign(user, response.data)
    message.value = `Đã cập nhật tài khoản ${user.fullName}.`
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể cập nhật'
  } finally {
    updatingId.value = ''
  }
}

function clearFilters() {
  search.value = ''
  role.value = ''
  status.value = ''
  providerFilter.value = ''
  void load()
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <main class="app-page">
      <header>
        <p class="text-sm font-bold uppercase tracking-[.14em] text-purple-600">Quản trị tài khoản</p>
        <h1 class="app-page-title mt-2">Quản lý người dùng & Phương thức Đăng nhập</h1>
        <p class="app-page-description">Thống kê chi tiết số lượng tài khoản đăng nhập qua Google, GitHub và Email.</p>
      </header>

      <!-- Metrics summary cards -->
      <section class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="admin-metric">
          <div>
            <span>Tổng người dùng</span>
            <b>{{ users.length }}</b>
          </div>
          <span class="text-xs font-bold text-slate-400">Tất cả</span>
        </article>

        <article class="admin-metric border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div>
            <span class="text-blue-600 dark:text-blue-400">Đăng nhập Google</span>
            <b class="text-blue-700 dark:text-blue-300">{{ googleCount }}</b>
          </div>
          <span class="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-black text-blue-800 dark:bg-blue-900 dark:text-blue-200">G</span>
        </article>

        <article class="admin-metric border-slate-300 bg-slate-100/50 dark:border-slate-700 dark:bg-slate-900/50">
          <div>
            <span class="text-slate-700 dark:text-slate-300">Đăng nhập GitHub</span>
            <b class="text-slate-900 dark:text-white">{{ githubCount }}</b>
          </div>
          <span class="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-black text-white dark:bg-white dark:text-slate-900">GH</span>
        </article>

        <article class="admin-metric border-purple-200 bg-purple-50/40 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div>
            <span class="text-purple-600 dark:text-purple-400">Đăng ký Email</span>
            <b class="text-purple-700 dark:text-purple-300">{{ emailCount }}</b>
          </div>
          <span class="rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-black text-purple-800 dark:bg-purple-900 dark:text-purple-200">@</span>
        </article>
      </section>

      <!-- Filter Controls -->
      <section class="surface-card mt-6 p-4">
        <form class="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]" @submit.prevent="load">
          <label class="relative">
            <span class="sr-only">Tìm kiếm</span>
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input v-model="search" class="admin-control pl-10" placeholder="Tìm theo tên hoặc email..." />
          </label>

          <select v-model="providerFilter" class="admin-control">
            <option value="">Tất cả phương thức</option>
            <option value="GOOGLE">Đăng nhập Google</option>
            <option value="GITHUB">Đăng nhập GitHub</option>
            <option value="EMAIL">Email & Mật khẩu</option>
          </select>

          <select v-model="role" class="admin-control">
            <option value="">Tất cả vai trò</option>
            <option value="STUDENT">Học viên</option>
            <option value="INSTRUCTOR">Giảng viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>

          <select v-model="status" class="admin-control">
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="BLOCKED">Đã khóa</option>
          </select>

          <BaseButton type="submit">Tìm kiếm</BaseButton>
        </form>

        <button v-if="search || role || status || providerFilter" class="mt-3 text-xs font-bold text-purple-600" @click="clearFilters">
          Đặt lại bộ lọc
        </button>
      </section>

      <p v-if="error" class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p>
      <p v-if="message" class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{{ message }}</p>

      <LoadingSpinner v-if="api.loading.value && !users.length" class="py-20" />

      <!-- Users Table -->
      <section v-else class="surface-card mt-6 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Phương thức đăng nhập</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th class="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="flex items-center gap-3">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.fullName" class="h-10 w-10 rounded-xl object-cover" />
                    <span v-else class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 font-bold text-white">
                      {{ user.fullName.charAt(0) }}
                    </span>
                    <div>
                      <b class="line-clamp-1">{{ user.fullName }}</b>
                      <p class="mt-1 text-xs text-slate-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Login Provider Badge -->
                <td>
                  <span
                    v-if="user.googleId"
                    class="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                  >
                    <span class="font-black text-blue-600">G</span> Google
                  </span>
                  <span
                    v-else-if="user.githubId"
                    class="inline-flex items-center gap-1.5 rounded-full border border-slate-400 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <span>🐙</span> GitHub
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    <span>✉</span> Email
                  </span>
                </td>

                <td>
                  <select
                    :value="user.role"
                    class="admin-control min-w-32"
                    :disabled="updatingId === user.id"
                    @change="update(user, { role: ($event.target as HTMLSelectElement).value as UserRole })"
                  >
                    <option value="STUDENT">Học viên</option>
                    <option value="INSTRUCTOR">Giảng viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </td>

                <td>
                  <StatusBadge :status="user.status" />
                </td>

                <td class="text-sm text-slate-500 font-mono">
                  {{ new Date(user.createdAt).toLocaleDateString('vi-VN') }}
                </td>

                <td class="text-right">
                  <BaseButton
                    size="sm"
                    :variant="user.status === 'ACTIVE' ? 'ghost' : 'secondary'"
                    :loading="updatingId === user.id"
                    @click="update(user, { status: (user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE') as UserStatus })"
                  >
                    {{ user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa' }}
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!filteredUsers.length" class="py-12 text-center text-sm text-slate-500">
          Không tìm thấy người dùng phù hợp.
        </p>
      </section>
    </main>
  </AdminLayout>
</template>

<style scoped>
.admin-metric { display:flex; align-items:center; justify-between:space-between; border:1px solid var(--border); border-radius:1.1rem; background:var(--surface); padding:1rem 1.2rem; }
.admin-metric span { font-size:.8rem; color:var(--text-muted); }
.admin-metric b { font-size:1.3rem; }
.admin-control { min-height:2.75rem; width:100%; border:1px solid var(--border); border-radius:.8rem; background:var(--surface-muted); padding:.65rem .85rem; color:var(--text); font-size:.82rem; outline:none; }
.admin-control:focus { border-color:#a855f7; box-shadow:0 0 0 3px rgba(168,85,247,.1); }
.admin-table { width:100%; min-width:820px; }
.admin-table th { background:var(--surface-muted); padding:.85rem 1.1rem; text-align:left; font-size:.67rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); }
.admin-table td { border-top:1px solid var(--border); padding:1rem 1.1rem; vertical-align:middle; }
.admin-table tbody tr:hover { background:color-mix(in srgb,var(--surface-muted) 60%,transparent); }
</style>
