<script setup lang="ts">
import { ref } from "vue";
import WorkspaceHeader from "@/components/layout/WorkspaceHeader.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";

const sidebarOpen = ref(false);
const icon = (path: string) =>
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/></svg>`;
const navItems = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: icon(
      "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    ),
  },
  {
    label: "Quản lý coupon",
    to: "/admin/coupons",
    icon: icon(
      "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
    ),
  },
  {
    label: "Quản lý hoàn tiền",
    to: "/admin/refunds",
    icon: icon(
      "M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z",
    ),
  },
  {
    label: "Quản lý payout",
    to: "/admin/payouts",
    icon: icon(
      "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    ),
  },
  {
    label: "Quản lý danh mục",
    to: "/admin/categories",
    icon: icon(
      "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    ),
  },
  {
    label: "Quản lý người dùng",
    to: "/admin/users",
    icon: icon(
      "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    ),
  },
  {
    label: "Quản lý khóa học",
    to: "/admin/courses",
    icon: icon(
      "M12 6.253v13M3 6.253v13c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0v-13c-3-1.5-6-1.5-9 0-3-1.5-6-1.5-9 0z",
    ),
  },
  {
    label: "Quản lý đánh giá",
    to: "/admin/reviews",
    icon: icon(
      "M11.049 2.927l2.204 4.466 4.928.716-3.566 3.476.842 4.908-4.408-2.318-4.408 2.318.842-4.908-3.566-3.476 4.928-.716 2.204-4.466z",
    ),
  },
];
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-[var(--app-bg)] transition-colors duration-300"
  >
    <WorkspaceHeader @toggle-workspace="sidebarOpen = true" />
    <div class="flex flex-1">
      <AppSidebar
        :items="navItems"
        :open="sidebarOpen"
        @close="sidebarOpen = false"
      />
      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <slot />
      </main>
    </div>
  </div>
</template>
