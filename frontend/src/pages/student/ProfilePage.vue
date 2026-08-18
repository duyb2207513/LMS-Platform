<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ImageFilePicker from '@/components/ui/ImageFilePicker.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, User } from '@/types'

const auth = useAuthStore()
const api = useApi()
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const avatarFile = ref<File | null>(null)
const pickerKey = ref(0)
const message = ref('')
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const user = await auth.fetchCurrentUser()
    if (user) {
      const parts = user.fullName.trim().split(/\s+/)
      firstName.value = user.firstName || parts.pop() || ''
      lastName.value = user.lastName || parts.join(' ')
      phoneNumber.value = user.phoneNumber || ''
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải hồ sơ'
  }
})

function selectAvatar(file: File | null) {
  avatarFile.value = file
  error.value = ''
}

async function save() {
  message.value = ''
  error.value = ''
  saving.value = true
  try {
    const profileResponse = await api.patch<ApiResponse<User>>('/users/me', {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      phoneNumber: phoneNumber.value.trim() || null,
    })
    if (profileResponse.data) auth.updateUser(profileResponse.data)

    if (avatarFile.value) {
      const body = new FormData()
      body.append('avatar', avatarFile.value)
      const avatarResponse = await api.post<ApiResponse<User>>('/users/me/avatar', body)
      if (avatarResponse.data) auth.updateUser(avatarResponse.data)
      avatarFile.value = null
      pickerKey.value += 1
    }
    message.value = 'Đã cập nhật hồ sơ'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ'
  } finally {
    saving.value = false
  }
}

async function removeAvatar() {
  if (!auth.user?.avatarUrl || !confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return
  message.value = ''
  error.value = ''
  saving.value = true
  try {
    const response = await api.del<ApiResponse<User>>('/users/me/avatar')
    if (response.data) auth.updateUser(response.data)
    avatarFile.value = null
    pickerKey.value += 1
    message.value = 'Đã xóa ảnh đại diện'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể xóa ảnh đại diện'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <DefaultLayout>
    <main class="mx-auto max-w-2xl px-4 py-12">
      <h1 class="text-3xl font-black dark:text-white">Hồ sơ của tôi</h1>
      <p class="mb-7 mt-2 text-slate-500">Cập nhật tên và tải ảnh đại diện từ thiết bị</p>

      <form class="space-y-5 rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <BaseInput id="profile-last-name" v-model="lastName" label="Họ và tên đệm" placeholder="Trần Minh" required />
          <BaseInput id="profile-first-name" v-model="firstName" label="Tên" placeholder="Duy" required />
        </div>
        <BaseInput id="profile-phone" v-model="phoneNumber" type="tel" label="Số điện thoại" placeholder="0901234567" />
        <BaseInput id="profile-email" :model-value="auth.user?.email || ''" label="Email" disabled />
        <ImageFilePicker
          :key="pickerKey"
          id="profile-avatar"
          label="Ảnh đại diện"
          :current-url="auth.user?.avatarUrl"
          :disabled="saving"
          @change="selectAvatar"
          @error="error = $event"
        />
        <button
          v-if="auth.user?.avatarUrl"
          type="button"
          class="text-sm font-semibold text-red-600 hover:text-red-700"
          :disabled="saving"
          @click="removeAvatar"
        >
          Xóa ảnh đại diện hiện tại
        </button>
        <p v-if="message" class="text-emerald-600">{{ message }}</p>
        <p v-if="error" class="text-red-600">{{ error }}</p>
        <BaseButton type="submit" :loading="saving">Lưu thay đổi</BaseButton>
      </form>
    </main>
  </DefaultLayout>
</template>
