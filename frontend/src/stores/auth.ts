import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest, ApiResponse, AuthResponse } from '@/types'
import { UserRole } from '@/types'
import { useApi } from '@/composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // Computed
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isStudent = computed(() => user.value?.role === UserRole.STUDENT)
  const isInstructor = computed(() => user.value?.role === UserRole.INSTRUCTOR)
  const isAdmin = computed(() => user.value?.role === UserRole.ADMIN)
  const userInitials = computed(() => {
    if (!user.value) return ''
    return user.value.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  // Initialize from localStorage
  function initialize() {
    const savedToken = localStorage.getItem('accessToken')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        logout()
      }
    }
  }

  // Actions
  async function login(credentials: LoginRequest) {
    const api = useApi()
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    if (response.data) {
      user.value = response.data.user
      token.value = response.data.accessToken
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  }

  async function register(data: RegisterRequest) {
    const api = useApi()
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
    if (response.data) {
      user.value = response.data.user
      token.value = response.data.accessToken
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    isLoggedIn,
    isStudent,
    isInstructor,
    isAdmin,
    userInitials,
    initialize,
    login,
    register,
    logout,
  }
})
