<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const navItems = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
  },
  {
    label: 'Quản lý danh mục',
    to: '/admin/categories',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>',
  },
  {
    label: 'Quản lý người dùng',
    to: '/admin/users',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  },
  { label: 'Quản lý khóa học', to: '/admin/courses', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13M3 6.253v13c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0v-13c-3-1.5-6-1.5-9 0-3-1.5-6-1.5-9 0z"/></svg>' },
  { label: 'Kiểm duyệt đánh giá', to: '/admin/reviews', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927l2.204 4.466 4.928.716-3.566 3.476.842 4.908-4.408-2.318-4.408 2.318.842-4.908-3.566-3.476 4.928-.716 2.204-4.466z"/></svg>' },
  { label: 'Kiểm duyệt bình luận', to: '/admin/comments', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m-9 6l2-4a8 8 0 1114-5 8 8 0 01-8 8H4z"/></svg>' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <AppHeader />
    <div class="flex flex-1">
      <AppSidebar :items="navItems" />
      <main class="flex-1 p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
