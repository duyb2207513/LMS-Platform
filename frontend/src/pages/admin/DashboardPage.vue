<script setup lang="ts">
import { onMounted, ref } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { AdminDashboardStats, ApiResponse } from "@/types";

const api = useApi(),
  stats = ref<AdminDashboardStats | null>(null),
  error = ref("");
async function load() {
  try {
    const response =
      await api.get<ApiResponse<AdminDashboardStats>>("/admin/dashboard");
    stats.value = response.data || null;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Không thể tải dashboard";
  }
}
onMounted(load);
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";
</script>

<template>
  <AdminLayout
    ><div class="max-w-7xl">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p class="mt-2 text-slate-500">Tổng quan hoạt động của LMS Platform</p>
      </div>
      <LoadingSpinner v-if="api.loading.value" />
      <div v-else-if="error" class="rounded-2xl bg-red-50 p-5 text-red-700">
        {{ error }}
      </div>
      <template v-else-if="stats">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat
            label="Người dùng"
            :value="stats.users.total"
            color="indigo"
          /><Stat
            label="Khóa học"
            :value="stats.courses.total"
            color="purple"
          /><Stat
            label="Lượt ghi danh"
            :value="stats.learning.enrollments"
            color="emerald"
          /><Stat
            label="Doanh thu"
            :value="money(stats.commerce.revenue)"
            color="amber"
          />
          <Stat
            label="Đơn đã thanh toán"
            :value="stats.commerce.paidOrders"
            color="cyan"
          /><Stat
            label="Đánh giá"
            :value="stats.learning.reviews"
            color="pink"
          /><Stat
            label="Bình luận"
            :value="stats.learning.comments"
            color="blue"
          /><Stat label="Chứng chỉ" :value="stats.certificates" color="green" />
        </div>
        <div class="grid lg:grid-cols-2 gap-6">
          <section class="panel">
            <h2 class="panel-title">Người dùng mới</h2>
            <div v-for="user in stats.recent.users" :key="user.id" class="row">
              <div>
                <b>{{ user.fullName }}</b>
                <p>{{ user.email }}</p>
              </div>
              <span>{{ user.role }}</span>
            </div>
          </section>
          <section class="panel">
            <h2 class="panel-title">Đơn hàng gần đây</h2>
            <div
              v-for="order in stats.recent.orders"
              :key="order.id"
              class="row"
            >
              <div>
                <b>{{ order.orderNumber }}</b>
                <p>{{ order.user.fullName }}</p>
              </div>
              <div class="text-right">
                <b>{{ money(order.total) }}</b>
                <p>{{ order.status }}</p>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div></AdminLayout
  >
</template>

<script lang="ts">
import { defineComponent, h } from "vue";
const Stat = defineComponent({
  props: { label: String, value: [String, Number], color: String },
  setup: (p) => () =>
    h(
      "div",
      {
        class:
          "rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm",
      },
      [
        h("p", { class: "text-sm text-slate-500" }, p.label),
        h(
          "p",
          { class: "text-2xl font-black text-slate-900 dark:text-white mt-2" },
          String(p.value),
        ),
      ],
    ),
});
export default { components: { Stat } };
</script>
<style scoped>
@reference "../../assets/main.css";
.panel {
  @apply bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5;
}
.panel-title {
  @apply text-lg font-bold text-slate-900 dark:text-white mb-3;
}
.row {
  @apply flex justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300;
}
.row p {
  @apply text-xs text-slate-400 mt-1;
}
</style>
