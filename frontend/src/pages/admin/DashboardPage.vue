<script setup lang="ts">
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/categories'
import { onMounted } from 'vue'

const auth = useAuthStore()
const categoryStore = useCategoryStore()

onMounted(() => {
  categoryStore.fetchCategories()
})
</script>

<template>
  <AdminLayout>
    <div class="max-w-6xl">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Dashboard 🛡️</h1>
        <p class="mt-2 text-lg text-slate-500 dark:text-slate-400">Xin chào, {{ auth.user?.fullName }}!</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ categoryStore.categories.length }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Danh mục</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">—</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Người dùng</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">—</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Khóa học</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <router-link to="/admin/categories" class="block bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:bg-purple-600 hover:border-purple-600 dark:hover:border-purple-800 transition-all duration-300 group">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-white dark:group-hover:text-purple-400 transition-colors">Quản lý danh mục</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Tạo, sửa, xóa danh mục khóa học</p>
        </router-link>
        <router-link to="/admin/users" class="block bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:bg-purple-600 hover:border-purple-600 dark:hover:border-purple-800 transition-all duration-300 group">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-white dark:group-hover:text-purple-400 transition-colors">Quản lý người dùng</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Xem và quản lý tài khoản người dùng</p>
        </router-link>
      </div>
    </div>
  </AdminLayout>
</template>
