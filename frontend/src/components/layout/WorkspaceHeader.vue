<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppBrand from "@/components/layout/AppBrand.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
import { API_BASE_URL } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{ toggleWorkspace: [] }>();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const quickActionsOpen = ref(false);
const profileOpen = ref(false);
const searchKeyword = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

const dashboardPath = computed(() =>
  auth.isAdmin ? "/admin" : auth.isInstructor ? "/instructor" : "/dashboard"
);

const roleBadgeText = computed(() =>
  auth.isAdmin ? "ADMIN PORTAL" : auth.isInstructor ? "INSTRUCTOR HUB" : "WORKSPACE"
);

const assetUrl = (url?: string | null) =>
  !url || url.startsWith("http")
    ? url || ""
    : `${API_BASE_URL.replace("/api/v1", "")}${url}`;

async function logout() {
  await auth.logout();
  profileOpen.value = false;
  quickActionsOpen.value = false;
  await router.push("/login");
}

function handleSearchSubmit() {
  if (!searchKeyword.value.trim()) return;
  const keyword = searchKeyword.value.trim();
  if (auth.isAdmin) {
    router.push({ path: "/admin/courses", query: { search: keyword } });
  } else if (auth.isInstructor) {
    router.push({ path: "/instructor/courses", query: { search: keyword } });
  }
}

// Global shortcut Ctrl+K / Cmd+K to focus search
function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

watch(
  () => route.fullPath,
  () => {
    quickActionsOpen.value = false;
    profileOpen.value = false;
  }
);
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/92"
  >
    <div
      class="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-3 px-3 sm:px-5 lg:px-8"
    >
      <!-- Left: Mobile menu toggle + Brand & Role Badge -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 lg:hidden"
          aria-label="Mở menu quản lý"
          @click="emit('toggleWorkspace')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-2.5">
          <AppBrand :to="dashboardPath" />
          <RouterLink
            :to="dashboardPath"
            :class="[
              'hidden rounded-lg px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm ring-1 ring-inset transition hover:opacity-80 sm:inline-flex',
              auth.isAdmin
                ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-400/30'
                : 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-400/30',
            ]"
          >
            {{ roleBadgeText }}
          </RouterLink>
        </div>
      </div>

      <!-- Center: Quick Management Search -->
      <div class="hidden max-w-md flex-1 md:block lg:max-w-lg">
        <form @submit.prevent="handleSearchSubmit" class="relative">
          <span
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            type="search"
            :placeholder="auth.isAdmin ? 'Tìm nhanh khóa học, coupon, người dùng...' : 'Tìm khóa học, bài tập...'"
            class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-14 text-xs font-medium text-slate-900 transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-purple-400 dark:focus:bg-slate-900"
          />
          <kbd
            class="pointer-events-none absolute inset-y-2 right-2.5 hidden items-center rounded-md border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-400 shadow-sm sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            Ctrl K
          </kbd>
        </form>
      </div>

      <!-- Right: Quick Actions + View Website + Theme + Notifications + Profile -->
      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <!-- Quick Action (+ Tạo mới) -->
        <div class="relative">
          <button
            type="button"
            class="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:from-violet-700 hover:to-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 sm:px-3.5"
            @click="quickActionsOpen = !quickActionsOpen; profileOpen = false"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">Tạo mới</span>
            <svg class="h-3.5 w-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <!-- Quick Action Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="quickActionsOpen"
              class="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
            >
              <template v-if="auth.isInstructor">
                <RouterLink
                  to="/instructor/courses/create"
                  class="profile-link flex items-center gap-2.5"
                >
                  <span class="grid h-7 w-7 place-items-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">Tạo khóa học mới</p>
                    <p class="text-[11px] text-slate-400">Soạn thảo giáo trình & bài giảng</p>
                  </div>
                </RouterLink>
                <RouterLink
                  to="/instructor/courses"
                  class="profile-link flex items-center gap-2.5"
                >
                  <span class="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">Tạo bài tập / Quiz</p>
                    <p class="text-[11px] text-slate-400">Giao bài tập trong khóa học</p>
                  </div>
                </RouterLink>
              </template>

              <template v-if="auth.isAdmin">
                <RouterLink
                  to="/admin/coupons"
                  class="profile-link flex items-center gap-2.5"
                >
                  <span class="grid h-7 w-7 place-items-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </span>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">Tạo mã Coupon</p>
                    <p class="text-[11px] text-slate-400">Chương trình khuyến mãi</p>
                  </div>
                </RouterLink>
                <RouterLink
                  to="/admin/categories"
                  class="profile-link flex items-center gap-2.5"
                >
                  <span class="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </span>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">Thêm danh mục</p>
                    <p class="text-[11px] text-slate-400">Phân loại chủ đề khóa học</p>
                  </div>
                </RouterLink>
                <RouterLink
                  to="/admin/refunds"
                  class="profile-link flex items-center gap-2.5"
                >
                  <span class="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" />
                    </svg>
                  </span>
                  <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">Duyệt hoàn tiền</p>
                    <p class="text-[11px] text-slate-400">Xử lý khiếu nại & hoàn phí</p>
                  </div>
                </RouterLink>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Button: Xem Website (Switch to Student Preview Mode) -->
        <RouterLink
          to="/courses"
          class="hidden h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-bold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 md:inline-flex dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
          title="Xem danh mục khóa học với tư cách học viên"
        >
          <svg class="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Xem Website</span>
        </RouterLink>

        <!-- Theme Toggle -->
        <ThemeToggle />

        <!-- Notification Bell -->
        <NotificationBell />

        <!-- Profile Menu -->
        <div class="relative">
          <button
            type="button"
            class="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-1.5 text-left shadow-sm transition hover:border-purple-200 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/15 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-800 dark:hover:bg-purple-950/30 sm:pr-3"
            :aria-expanded="profileOpen"
            aria-haspopup="menu"
            @click="profileOpen = !profileOpen; quickActionsOpen = false"
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
            >
              {{ auth.userInitials }}
            </span>
            <div class="hidden text-left sm:block">
              <span class="block text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {{ auth.user?.fullName }}
              </span>
              <span class="block text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                {{ auth.isAdmin ? "Quản trị viên" : "Giảng viên" }}
              </span>
            </div>
            <svg
              class="hidden h-4 w-4 text-slate-400 sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="profileOpen"
              class="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
              role="menu"
            >
              <div class="mb-1 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70">
                <p class="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {{ auth.user?.fullName }}
                </p>
                <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {{ auth.user?.email }}
                </p>
                <span
                  class="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                >
                  {{ roleBadgeText }}
                </span>
              </div>

              <RouterLink :to="dashboardPath" class="profile-link" role="menuitem">
                📊 Bảng điều khiển
              </RouterLink>

              <RouterLink
                v-if="auth.isInstructor"
                to="/instructor/revenue"
                class="profile-link"
                role="menuitem"
              >
                💰 Doanh thu & Payout
              </RouterLink>

              <RouterLink
                v-if="auth.isAdmin"
                to="/admin/users"
                class="profile-link"
                role="menuitem"
              >
                👥 Quản lý người dùng
              </RouterLink>

              <RouterLink
                v-if="auth.isAdmin"
                to="/admin/courses"
                class="profile-link"
                role="menuitem"
              >
                📚 Quản lý khóa học
              </RouterLink>

              <RouterLink to="/profile" class="profile-link" role="menuitem">
                👤 Hồ sơ cá nhân
              </RouterLink>
              <RouterLink to="/change-password" class="profile-link" role="menuitem">
                🔑 Đổi mật khẩu
              </RouterLink>
              <RouterLink to="/notifications" class="profile-link" role="menuitem">
                🔔 Trung tâm thông báo
              </RouterLink>
              <RouterLink to="/messages" class="profile-link" role="menuitem">
                💬 Tin nhắn
              </RouterLink>

              <div class="my-1 border-t border-slate-100 dark:border-slate-800" />

              <RouterLink
                to="/courses"
                class="profile-link text-purple-600 hover:text-purple-700 dark:text-purple-400"
                role="menuitem"
              >
                👁️ Xem giao diện Học viên
              </RouterLink>

              <button
                type="button"
                class="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                role="menuitem"
                @click="logout"
              >
                Đăng xuất
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.profile-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-slate-700, #334155);
  transition: all 150ms ease;
}

:global(.dark) .profile-link {
  color: var(--color-slate-200, #e2e8f0);
}

.profile-link:hover {
  background-color: var(--color-slate-100, #f1f5f9);
  color: var(--color-slate-950, #020617);
}

:global(.dark) .profile-link:hover {
  background-color: rgba(30, 41, 59, 0.7);
  color: #ffffff;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms ease-out;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
