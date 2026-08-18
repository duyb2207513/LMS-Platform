<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
const api = useApi(), auth = useAuthStore(), route = useRoute(), success = ref(false), error = ref('')
async function confirm() { const token = String(route.query.token || ''); if (!token) { error.value = 'Liên kết xác nhận không hợp lệ'; return } try { await api.post('/auth/confirm-email-change', { token }); auth.clear(); success.value = true } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể đổi email' } }
onMounted(confirm)
</script>
<template><AuthLayout><div class="text-center"><span :class="['mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl', success ? 'bg-emerald-100 text-emerald-700' : error ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700']">{{ success ? '✓' : error ? '×' : '···' }}</span><h1 class="mt-5 text-2xl font-extrabold">{{ success ? 'Đã cập nhật email' : error ? 'Không thể cập nhật email' : 'Đang xác nhận email mới' }}</h1><p class="mt-3 text-sm text-slate-500">{{ success ? 'Vui lòng đăng nhập lại bằng địa chỉ email mới.' : error }}</p><RouterLink v-if="success || error" to="/login"><BaseButton class="mt-6">Đăng nhập</BaseButton></RouterLink></div></AuthLayout></template>
