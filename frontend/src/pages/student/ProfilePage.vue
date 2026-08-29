<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ImageFilePicker from '@/components/ui/ImageFilePicker.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, User } from '@/types'

const auth = useAuthStore()
const api = useApi()
const route = useRoute()
const router = useRouter()
type ProfileSection = 'profile' | 'password' | 'email'
const initialSection: ProfileSection = route.query.section === 'password' ? 'password' : route.query.section === 'email' ? 'email' : 'profile'
const activeSection = ref<ProfileSection>(initialSection)
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const avatarFile = ref<File | null>(null)
const pickerKey = ref(0)
const message = ref('')
const error = ref('')
const saving = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const newEmail = ref('')
const emailCurrentPassword = ref('')
const newEmailError = ref('')
const emailMessage = ref('')
const emailError = ref('')

function selectSection(section: ProfileSection) {
  activeSection.value = section
  void router.replace({ path: '/profile', query: section === 'profile' ? {} : { section } })
}

function validateNewEmail() {
  const mail = newEmail.value.trim().toLowerCase()
  if (!mail) newEmailError.value = ''
  else if (mail.endsWith('@example.com')) newEmailError.value = 'Không được sử dụng email có đuôi @example.com'
  else if (mail === auth.user?.email.toLowerCase()) newEmailError.value = 'Email mới phải khác email hiện tại'
  else newEmailError.value = ''
}

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

async function savePassword() {
  passwordMessage.value = ''
  passwordError.value = ''
  if (newPassword.value === currentPassword.value) {
    passwordError.value = 'Mật khẩu mới không được giống mật khẩu hiện tại'
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = 'Mật khẩu xác nhận không khớp'
    return
  }
  try {
    await api.patch('/users/me/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value,
    })
    passwordMessage.value = 'Đổi mật khẩu thành công'
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (cause) {
    passwordError.value = cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu'
  }
}

async function changeEmail() {
  emailMessage.value = ''
  emailError.value = ''
  validateNewEmail()
  if (newEmailError.value) return
  try {
    await api.post('/auth/change-email', {
      newEmail: newEmail.value.trim().toLowerCase(),
      currentPassword: emailCurrentPassword.value || undefined,
    })
    emailMessage.value = 'Đã gửi liên kết xác nhận đến địa chỉ email mới'
    newEmail.value = ''
    emailCurrentPassword.value = ''
  } catch (cause) {
    emailError.value = cause instanceof Error ? cause.message : 'Không thể đổi địa chỉ email'
  }
}
</script>

<template>
  <DefaultLayout>
    <main class="navbar-page">
      <div class="inline-flex border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button type="button" :class="['px-3 py-2 text-xs font-bold transition', activeSection === 'profile' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800']" @click="selectSection('profile')">Thông tin cá nhân</button>
        <button type="button" :class="['px-3 py-2 text-xs font-bold transition', activeSection === 'password' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800']" @click="selectSection('password')">Đổi mật khẩu</button>
        <button type="button" :class="['px-3 py-2 text-xs font-bold transition', activeSection === 'email' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800']" @click="selectSection('email')">Đổi email</button>
      </div>

      <form v-if="activeSection === 'profile'" class="mt-3 space-y-4 border bg-white p-4 dark:border-slate-800 dark:bg-slate-900" @submit.prevent="save">
        <div><h2 class="text-base font-black">Thông tin cá nhân</h2><p class="mt-1 text-xs text-slate-500">Cập nhật tên, số điện thoại và ảnh đại diện.</p></div>
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

      <form v-else-if="activeSection === 'password'" class="mt-3 space-y-4 border bg-white p-4 dark:border-slate-800 dark:bg-slate-900" @submit.prevent="savePassword">
        <div><h2 class="text-base font-black">Đổi mật khẩu</h2><p class="mt-1 text-xs text-slate-500">Mật khẩu mới phải có chữ hoa, chữ thường, số và tối thiểu 8 ký tự.</p></div>
        <BaseInput id="current-password" v-model="currentPassword" type="password" label="Mật khẩu hiện tại" autocomplete="current-password" required />
        <BaseInput id="new-password" v-model="newPassword" type="password" label="Mật khẩu mới" autocomplete="new-password" required />
        <BaseInput id="confirm-new-password" v-model="confirmNewPassword" type="password" label="Xác nhận mật khẩu mới" autocomplete="new-password" required />
        <p v-if="passwordMessage" class="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{{ passwordMessage }}</p>
        <p v-if="passwordError" class="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">{{ passwordError }}</p>
        <BaseButton type="submit" :loading="api.loading.value">Cập nhật mật khẩu</BaseButton>
      </form>

      <form v-else class="mt-3 space-y-4 border bg-white p-4 dark:border-slate-800 dark:bg-slate-900" @submit.prevent="changeEmail">
        <div><h2 class="text-base font-black">Đổi địa chỉ email</h2><p class="mt-1 text-xs text-slate-500">Một liên kết xác nhận sẽ được gửi đến email mới trước khi thay đổi có hiệu lực.</p></div>
        <BaseInput id="current-email" :model-value="auth.user?.email || ''" type="email" label="Email hiện tại" disabled />
        <BaseInput id="new-email" v-model="newEmail" type="email" label="Email mới" placeholder="ban@gmail.com" :error="newEmailError" required @blur="validateNewEmail" @input="validateNewEmail" />
        <BaseInput id="email-current-password" v-model="emailCurrentPassword" type="password" label="Mật khẩu hiện tại" hint="Không bắt buộc với tài khoản Google hoặc GitHub" autocomplete="current-password" />
        <p v-if="emailMessage" class="bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{{ emailMessage }}</p>
        <p v-if="emailError" class="bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">{{ emailError }}</p>
        <BaseButton type="submit" :loading="api.loading.value">Gửi email xác nhận</BaseButton>
      </form>
    </main>
  </DefaultLayout>
</template>
