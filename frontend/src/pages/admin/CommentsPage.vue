<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { AdminComment, AdminListResponse } from "@/types";
const api = useApi(),
  items = ref<AdminComment[]>([]),
  search = ref(""),
  error = ref(""),
  hideTarget = ref<AdminComment | null>(null),
  hiding = ref(false);
const visibleCount = computed(
  () => items.value.filter((item) => !item.isDeleted).length,
);
async function load() {
  error.value = "";
  try {
    const response = await api.get<AdminListResponse<AdminComment>>(
      "/admin/comments",
      { search: search.value.trim(), limit: 100 },
    );
    items.value = response.data?.items || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể tải bình luận";
  }
}
async function hide() {
  if (!hideTarget.value) return;
  hiding.value = true;
  try {
    await api.del(`/admin/comments/${hideTarget.value.id}`);
    const target = items.value.find((item) => item.id === hideTarget.value?.id);
    if (target) {
      target.isDeleted = true;
      target.content = null;
    }
    hideTarget.value = null;
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không thể ẩn bình luận";
  } finally {
    hiding.value = false;
  }
}
onMounted(load);
</script>

<template>
  <AdminLayout
    ><main class="app-page max-w-6xl">
      <nav
        class="mb-6 flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        <RouterLink
          to="/admin/reviews"
          class="rounded-lg px-4 py-2 text-sm font-bold text-slate-500"
          >Đánh giá khóa học</RouterLink
        >
        <RouterLink
          to="/admin/comments"
          class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white"
          >Bình luận bài học</RouterLink
        >
      </nav>
      <header>
        <p class="text-sm font-bold uppercase tracking-[.14em] text-purple-600">
          Thảo luận học tập
        </p>
        <h1 class="app-page-title mt-2">Kiểm duyệt bình luận</h1>
        <p class="app-page-description">
          Giám sát trao đổi trong bài học và xử lý nội dung vi phạm.
        </p>
      </header>
      <section class="mt-7 grid gap-4 sm:grid-cols-2">
        <article class="moderation-metric">
          <span>Tổng bình luận</span><b>{{ items.length }}</b>
        </article>
        <article class="moderation-metric">
          <span>Đang hiển thị</span><b>{{ visibleCount }}</b>
        </article>
      </section>
      <form class="surface-card mt-6 flex gap-3 p-4" @submit.prevent="load">
        <input
          v-model="search"
          class="admin-search"
          placeholder="Tìm người dùng, bài học hoặc nội dung..."
        /><BaseButton type="submit">Tìm kiếm</BaseButton>
      </form>
      <p
        v-if="error"
        class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
      >
        {{ error }}
      </p>
      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <section v-else-if="items.length" class="mt-6 space-y-4">
        <article
          v-for="item in items"
          :key="item.id"
          :class="[
            'surface-card p-5 sm:p-6',
            item.isDeleted ? 'opacity-65' : '',
          ]"
        >
          <div class="flex items-start gap-4">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white"
              >{{ item.user.fullName.charAt(0) }}</span
            >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-extrabold">{{ item.user.fullName }}</h2>
                    <StatusBadge :status="item.user.role" />
                  </div>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ item.user.email }} ·
                    {{ new Date(item.createdAt).toLocaleDateString("vi-VN") }}
                  </p>
                </div>
                <StatusBadge
                  :status="item.isDeleted ? 'CANCELLED' : 'ACTIVE'"
                />
              </div>
              <p
                class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-purple-700 dark:bg-slate-800 dark:text-purple-300"
              >
                {{ item.lesson.section.course.title }}
                <span class="text-slate-400">/</span> {{ item.lesson.title }}
              </p>
              <p
                :class="[
                  'mt-4 leading-7',
                  item.isDeleted
                    ? 'italic text-slate-400'
                    : 'text-slate-600 dark:text-slate-300',
                ]"
              >
                {{
                  item.isDeleted
                    ? "Bình luận đã bị quản trị viên ẩn."
                    : item.content
                }}
              </p>
              <div
                v-if="!item.isDeleted"
                class="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800"
              >
                <BaseButton size="sm" variant="ghost" @click="hideTarget = item"
                  >Ẩn bình luận</BaseButton
                >
              </div>
            </div>
          </div>
        </article>
      </section>
      <section
        v-else-if="!api.loading.value"
        class="surface-card mt-6 py-16 text-center text-sm text-slate-500"
      >
        Không có bình luận phù hợp.
      </section>
    </main>
    <BaseModal
      :show="Boolean(hideTarget)"
      title="Ẩn bình luận?"
      description="Nội dung sẽ không còn hiển thị với học viên."
      size="sm"
      @close="!hiding && (hideTarget = null)"
      ><p class="text-sm text-slate-600 dark:text-slate-300">
        Xác nhận ẩn bình luận của <b>{{ hideTarget?.user.fullName }}</b
        >?
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <BaseButton
          variant="secondary"
          :disabled="hiding"
          @click="hideTarget = null"
          >Hủy</BaseButton
        ><BaseButton variant="danger" :loading="hiding" @click="hide"
          >Ẩn bình luận</BaseButton
        >
      </div></BaseModal
    ></AdminLayout
  >
</template>

<style scoped>
.moderation-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 1.1rem;
  background: var(--surface);
  padding: 1rem 1.2rem;
}
.moderation-metric span {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.moderation-metric b {
  font-size: 1.3rem;
}
.admin-search {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 0.8rem;
  background: var(--surface-muted);
  padding: 0.7rem 1rem;
  color: var(--text);
  outline: none;
}
.admin-search:focus {
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}
</style>
