<script setup lang="ts">
import { onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import { useApi } from "@/composables/useApi";
import type { ApiResponse, Certificate } from "@/types";
const api = useApi(),
  items = ref<Certificate[]>([]),
  error = ref("");
async function load() {
  try {
    const response =
      await api.get<ApiResponse<Certificate[]>>("/certificates/me");
    items.value = response.data || [];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Không tải được chứng chỉ";
  }
}
onMounted(load);
</script>

<template>
  <DefaultLayout
    ><main class="app-page navbar-page">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-bold uppercase tracking-wider text-purple-600">
            Thành tích
          </p>
          <h1 class="app-page-title mt-2">Chứng chỉ của tôi</h1>
          <p class="app-page-description">
            Ghi nhận những khóa học bạn đã hoàn thành trên LMS Platform.
          </p>
        </div>
        <RouterLink to="/certificates/verify"
          ><BaseButton variant="secondary"
            >Xác minh chứng chỉ</BaseButton
          ></RouterLink
        >
      </header>
      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />
      <p v-if="error" class="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">
        {{ error }}
      </p>
      <section v-if="items.length" class="mt-4 grid gap-3 lg:grid-cols-2">
        <article
          v-for="certificate in items"
          :key="certificate.id"
          class="certificate-card"
        >
          <span class="certificate-seal">LMS</span>
          <div class="relative">
            <p
              class="text-xs font-black uppercase tracking-[.2em] text-purple-700 dark:text-purple-300"
            >
              Certificate of completion
            </p>
            <h2 class="mt-5 text-2xl font-black leading-tight">
              {{ certificate.courseTitleSnapshot }}
            </h2>
            <p class="mt-4 text-sm text-slate-500">
              Chứng nhận hoàn thành dành cho
            </p>
            <p class="mt-1 text-xl font-extrabold">
              {{ certificate.studentNameSnapshot }}
            </p>
            <div
              class="mt-6 grid gap-3 border-t border-slate-200 pt-5 text-xs dark:border-slate-700 sm:grid-cols-2"
            >
              <div>
                <p class="text-slate-400">Giảng viên</p>
                <b class="mt-1 block">{{
                  certificate.instructorNameSnapshot
                }}</b>
              </div>
              <div>
                <p class="text-slate-400">Ngày cấp</p>
                <b class="mt-1 block">{{
                  new Date(certificate.issuedAt).toLocaleDateString("vi-VN")
                }}</b>
              </div>
            </div>
            <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
              <code
                class="rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800"
                >{{ certificate.certificateNumber }}</code
              ><RouterLink
                :to="`/certificates/verify/${certificate.verificationCode}`"
                class="text-sm font-bold text-purple-700 dark:text-purple-300"
                >Xác minh công khai →</RouterLink
              >
            </div>
          </div>
        </article>
      </section>
      <section
        v-else-if="!api.loading.value"
        class="surface-card mt-8 grid min-h-80 place-items-center p-8 text-center"
      >
        <div>
          <span
            class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-purple-100 text-3xl dark:bg-purple-950/50"
            >♛</span
          >
          <h2 class="mt-5 text-xl font-extrabold">Chưa có chứng chỉ</h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Hoàn thành toàn bộ bài học để đủ điều kiện nhận chứng chỉ.
          </p>
          <RouterLink to="/my-courses"
            ><BaseButton class="mt-5">Tiếp tục học</BaseButton></RouterLink
          >
        </div>
      </section>
    </main></DefaultLayout
  >
</template>

<style scoped>
.certificate-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 1.5rem;
  background:
    radial-gradient(
      circle at 100% 0,
      rgba(216, 180, 254, 0.35),
      transparent 32%
    ),
    var(--surface);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}
.certificate-card::after {
  content: "";
  position: absolute;
  width: 10rem;
  height: 10rem;
  right: -5rem;
  bottom: -6rem;
  border: 1px solid rgba(168, 85, 247, 0.18);
  border-radius: 50%;
  box-shadow: 0 0 0 25px rgba(168, 85, 247, 0.05);
}
.certificate-seal {
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border: 2px solid #a855f7;
  border-radius: 50%;
  color: #7c3aed;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow:
    inset 0 0 0 4px var(--surface),
    inset 0 0 0 5px #d8b4fe;
}
</style>
