<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { User, ApiResponse } from '@/types'

const api = useApi()
const users = ref<User[]>([])
const loading = ref(true)

function getRoleBadge(role: string) {
  switch (role) {
    case 'ADMIN': return { text: 'Admin', class: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' }
    case 'INSTRUCTOR': return { text: 'Giảng viên', class: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' }
    default: return { text: 'Học viên', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
  }
}

function getStatusBadge(status: string) {
  return status === 'ACTIVE'
    ? { text: 'Hoạt động', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' }
    : { text: 'Bị khóa', class: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN')
}

onMounted(async () => {
  try {
    const res = await api.get<ApiResponse<User[]>>('/users')
    if (res.data) users.value = res.data
  } catch {
    // Users API may not be ready yet
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <div class="max-w-6xl">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Quản lý người dùng</h1>
        <p class="mt-2 text-slate-500 dark:text-slate-400">Xem và quản lý tất cả người dùng trong hệ thống</p>
      </div>

      <LoadingSpinner v-if="loading" />

      <div v-else-if="users.length === 0" class="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <svg class="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">Chưa có người dùng nào</h3>
        <p class="text-slate-500 dark:text-slate-400 mt-2">API quản lý người dùng sẽ được phát triển sớm</p>
      </div>

      <div v-else class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100 dark:border-slate-800">
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Người dùng</th>
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Vai trò</th>
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Trạng thái</th>
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {{ u.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ u.fullName }}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 hidden sm:table-cell">
                <span :class="['px-2.5 py-1 rounded-lg text-xs font-semibold', getRoleBadge(u.role).class]">
                  {{ getRoleBadge(u.role).text }}
                </span>
              </td>
              <td class="px-6 py-4 hidden md:table-cell">
                <span :class="['px-2.5 py-1 rounded-lg text-xs font-semibold', getStatusBadge(u.status).class]">
                  {{ getStatusBadge(u.status).text }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{{ formatDate(u.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>
