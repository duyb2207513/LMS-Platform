<script setup lang="ts">
import { onMounted, ref } from "vue";

const apiMessage = ref("Đang kết nối backend...");
const hasError = ref(false);

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error("Backend response was not successful");
    }

    const result = await response.json();
    apiMessage.value = result.message;
  } catch {
    hasError.value = true;
    apiMessage.value = "Không thể kết nối backend";
  }
});
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-6">
    <section class="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
      <h1 class="text-3xl font-bold text-slate-900">LMS Platform</h1>
      <p class="mt-3 text-slate-600">VueJS, ExpressJS, Prisma và PostgreSQL</p>
      <div
        class="mt-6 rounded-lg p-4"
        :class="hasError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
      >
        {{ apiMessage }}
      </div>
    </section>
  </main>
</template>
