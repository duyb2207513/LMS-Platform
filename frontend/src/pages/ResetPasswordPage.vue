<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
const api = useApi(), route = useRoute(), router = useRouter(), newPassword = ref(''), confirmNewPassword = ref(''), error = ref('')
async function submit() { error.value = ''; const token = String(route.query.token || ''); if (!token) { error.value = 'Liên kết đặt lại mật khẩu không hợp lệ'; return } try { await api.post('/auth/reset-password', { token, newPassword: newPassword.value, confirmNewPassword: confirmNewPassword.value }); await router.push({ path: '/login', query: { reset: '1' } }) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể đặt lại mật khẩu' } }
</script>
<template><AuthLayout><form class="space-y-5" @submit.prevent="submit"><div class="text-center"><h1 class="text-2xl font-extrabold">Tạo mật khẩu mới</h1><p class="mt-2 text-sm text-slate-500">Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường và số.</p></div><BaseInput id="new-password" v-model="newPassword" type="password" label="Mật khẩu mới" required/><BaseInput id="confirm-new-password" v-model="confirmNewPassword" type="password" label="Xác nhận mật khẩu mới" required/><p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</p><BaseButton type="submit" :loading="api.loading.value" :full-width="true">Đặt lại mật khẩu</BaseButton></form></AuthLayout></template>
