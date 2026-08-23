<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppBrand from "@/components/layout/AppBrand.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
import { API_BASE_URL } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";

const props = withDefaults(defineProps<{ workspace?: boolean; sidebar?: boolean }>(), {
  workspace: false,
  sidebar: false,
});
const emit = defineEmits<{ toggleWorkspace: [] }>();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const mobileMenuOpen = ref(false);
const profileOpen = ref(false);
const assetUrl = (url?: string | null) =>
  !url || url.startsWith("http")
    ? url || ""
    : `${API_BASE_URL.replace("/api/v1", "")}${url}`;

const dashboardPath = () =>
  auth.isAdmin ? "/admin" : auth.isInstructor ? "/instructor" : "/dashboard";
const mainLinkClass = (path: string) => {
  const active =
    path === "/"
      ? route.path === "/"
      : route.path === path || route.path.startsWith(`${path}/`);
  if (!auth.isLoggedIn) {
    return [
      "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-white text-violet-700"
        : "text-violet-100 hover:bg-violet-600 hover:text-white",
    ];
  }
  return [
    "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
    active
      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  ];
};

async function logout() {
  await auth.logout();
  profileOpen.value = false;
  mobileMenuOpen.value = false;
  await router.push("/login");
}

function toggleMobileNavigation() {
  profileOpen.value = false;
  if (props.workspace || props.sidebar) emit("toggleWorkspace");
  else mobileMenuOpen.value = !mobileMenuOpen.value;
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
    profileOpen.value = false;
  },
);
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-40 border-b shadow-sm',
      !auth.isLoggedIn
        ? 'border-violet-800 bg-gradient-to-r from-indigo-800 via-violet-700 to-purple-700'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
    ]"
  >
    <div
      class="flex h-[4.5rem] w-full items-center justify-between gap-3 px-4 sm:px-6"
    >
      <div class="flex min-w-0 items-center gap-7">
        <AppBrand :compact="!auth.isLoggedIn || auth.isStudent" icon-size="lg" />

        <nav
          v-if="!workspace"
          class="hidden items-center gap-1 md:flex"
          aria-label="Điều hướng chính"
        >
          <RouterLink :to="auth.isStudent ? '/dashboard' : '/'" :class="mainLinkClass(auth.isStudent ? '/dashboard' : '/')">Trang chủ</RouterLink>
          <RouterLink to="/courses" :class="mainLinkClass('/courses')"
            >Khám phá</RouterLink
          >
          <RouterLink
            v-if="auth.isStudent"
            to="/my-courses"
            :class="mainLinkClass('/my-courses')"
            >Khóa học của tôi</RouterLink
          >
        </nav>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <RouterLink
          v-if="auth.isAdmin || auth.isInstructor"
          :to="dashboardPath()"
          class="hidden h-10 items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/80 px-3 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 md:inline-flex"
        >
          <svg class="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ auth.isAdmin ? "Trang Quản trị" : "Quản trị Giảng viên" }}</span>
        </RouterLink>

        <ThemeToggle />

        <NotificationBell v-if="auth.isLoggedIn" />

        <template v-if="!auth.isLoggedIn">
          <RouterLink
            to="/login"
            class="hidden min-h-10 items-center rounded-xl border-2 border-white px-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-violet-700 sm:inline-flex"
          >
            Đăng nhập
          </RouterLink>
          <RouterLink
            to="/register"
            class="inline-flex min-h-10 items-center rounded-xl border-2 border-white bg-white px-3.5 text-sm font-bold text-violet-700 shadow-md transition hover:border-violet-100 hover:bg-violet-100 sm:px-4"
          >
            Đăng ký
          </RouterLink>
        </template>

        <div v-else-if="!auth.isStudent" class="relative">
          <button
            type="button"
            class="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-1.5 text-left shadow-sm transition hover:border-purple-200 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 sm:pr-3"
            :aria-expanded="profileOpen"
            aria-haspopup="menu"
            @click="profileOpen = !profileOpen; mobileMenuOpen = false"
          >
            <img
              v-if="auth.user?.avatarUrl"
              :src="assetUrl(auth.user.avatarUrl)"
              alt=""
              class="h-8 w-8 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900"
            />
            <span
              v-else
              class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-xs font-bold text-white ring-2 ring-purple-100 dark:ring-purple-900"
              >{{ auth.userInitials }}</span
            >
            <span
              class="hidden text-sm font-semibold text-slate-800 sm:block dark:text-slate-100 whitespace-nowrap"
              >{{ auth.user?.fullName }}</span
            >
            <svg
              class="hidden h-4 w-4 text-slate-400 sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m6 9 6 6 6-6"
              />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="profileOpen"
              class="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
              role="menu"
            >
              <div
                class="mb-1 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70"
              >
                <p
                  class="truncate text-sm font-bold text-slate-900 dark:text-white"
                >
                  {{ auth.user?.fullName }}
                </p>
                <p
                  class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400"
                >
                  {{ auth.user?.email }}
                </p>
                <span
                  class="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-1 text-[10px] font-bold tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                  >{{ auth.user?.role }}</span
                >
              </div>
              <RouterLink
                :to="dashboardPath()"
                class="profile-link"
                role="menuitem"
                >Dashboard</RouterLink
              >
              <RouterLink
                v-if="auth.isStudent"
                to="/dashboard/analytics"
                class="profile-link"
                role="menuitem"
                >📊 Phân tích tiến độ</RouterLink
              >
              <RouterLink
                v-if="auth.isInstructor"
                to="/instructor/analytics"
                class="profile-link"
                role="menuitem"
                >📊 Báo cáo giảng dạy</RouterLink
              >
              <RouterLink to="/profile" class="profile-link" role="menuitem"
                >Hồ sơ cá nhân</RouterLink
              >
              <RouterLink
                to="/change-password"
                class="profile-link"
                role="menuitem"
                >Đổi mật khẩu</RouterLink
              >
              <RouterLink
                to="/notifications"
                class="profile-link"
                role="menuitem"
                >Trung tâm thông báo</RouterLink
              >
              <RouterLink to="/messages" class="profile-link" role="menuitem"
                >Tin nhắn</RouterLink
              >
              <RouterLink
                to="/notifications/settings"
                class="profile-link"
                role="menuitem"
                >Cài đặt thông báo</RouterLink
              >
              <template v-if="auth.isStudent">
                <RouterLink
                  to="/my-courses"
                  class="profile-link"
                  role="menuitem"
                  >Khóa học của tôi</RouterLink
                >
                <RouterLink to="/orders" class="profile-link" role="menuitem"
                  >Đơn hàng</RouterLink
                >
                <RouterLink
                  to="/certificates"
                  class="profile-link"
                  role="menuitem"
                  >Chứng chỉ</RouterLink
                >
              </template>
              <div
                class="my-1 border-t border-slate-100 dark:border-slate-800"
              />
              <button
                type="button"
                class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                role="menuitem"
                @click="logout"
              >
                Đăng xuất
              </button>
            </div>
          </Transition>
        </div>

        <button
          v-else
          type="button"
          class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white sm:px-4 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
          @click="logout"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 17l5-5-5-5m5 5H3m9-8h6a2 2 0 012 2v12a2 2 0 01-2 2h-6" /></svg>
          <span class="hidden sm:inline">Đăng xuất</span>
        </button>

        <button
          type="button"
          :class="[
            'grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30',
            workspace || sidebar ? 'lg:hidden' : 'md:hidden',
          ]"
          :aria-label="workspace || sidebar ? 'Mở thanh điều hướng' : 'Mở menu điều hướng'"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileNavigation"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 7h16M4 12h16M4 17h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="mobile-nav">
      <nav
        v-if="mobileMenuOpen && !workspace && !sidebar"
        class="border-t border-slate-100 bg-white px-3 py-3 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-950"
        aria-label="Điều hướng mobile"
      >
        <div class="mx-auto grid max-w-7xl gap-1">
          <RouterLink :to="auth.isStudent ? '/dashboard' : '/'" :class="mainLinkClass(auth.isStudent ? '/dashboard' : '/')">Trang chủ</RouterLink>
          <RouterLink to="/courses" :class="mainLinkClass('/courses')"
            >Khám phá</RouterLink
          >
          <RouterLink
            v-if="auth.isStudent"
            to="/my-courses"
            :class="mainLinkClass('/my-courses')"
            >Khóa học của tôi</RouterLink
          >
          <RouterLink
            v-if="auth.isAdmin || auth.isInstructor"
            :to="dashboardPath()"
            class="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
            >⚙️ {{ auth.isAdmin ? "Vào trang Quản trị" : "Vào trang Giảng viên" }}</RouterLink
          >
          <RouterLink
            v-if="!auth.isLoggedIn"
            to="/login"
            class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >Đăng nhập</RouterLink
          >
        </div>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.profile-link {
  display: block;
  border-radius: 0.75rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}
.profile-link:hover {
  background: #f3e8ff;
  color: #6d28d9;
}
:global(.dark) .profile-link {
  color: #cbd5e1;
}
:global(.dark) .profile-link:hover {
  background: rgba(88, 28, 135, 0.28);
  color: #d8b4fe;
}
.dropdown-enter-active,
.dropdown-leave-active,
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
