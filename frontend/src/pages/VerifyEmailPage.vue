<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
const api = useApi(), route = useRoute(), success = ref(false), error = ref('')
async function verify() { const token = String(route.query.token || ''); if (!token) { error.value = 'Liên kết xác minh không hợp lệ'; return } try { await api.post('/auth/verify-email', { token }); success.value = true } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể xác minh email' } }
onMounted(verify)
</script>
<template><AuthLayout><div class="text-center"><span :class="['mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl', success ? 'bg-emerald-100 text-emerald-700' : error ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700']">{{ success ? '✓' : error ? '×' : '···' }}</span><h1 class="mt-5 text-2xl font-extrabold">{{ success ? 'Email đã được xác minh' : error ? 'Không thể xác minh email' : 'Đang xác minh email' }}</h1><p class="mt-3 text-sm leading-6 text-slate-500">{{ success ? 'Tài khoản của bạn đã sẵn sàng để sử dụng.' : error || 'Vui lòng chờ trong giây lát.' }}</p><RouterLink v-if="success || error" to="/login"><BaseButton class="mt-6">Đến trang đăng nhập</BaseButton></RouterLink></div></AuthLayout></template>
