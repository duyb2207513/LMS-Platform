import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data
  try {
    data = await response.json()
  } catch {
    data = {}
  }
  
  if (!response.ok) {
    const error = new Error(data.message || `HTTP error ${response.status}`) as any
    error.status = response.status
    throw error
  }
  return data
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function doRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) throw new Error('Refresh failed')

    const responseData = await response.json()
    if (responseData.data && responseData.data.accessToken) {
      const authStore = useAuthStore()
      authStore.updateTokens(responseData.data.accessToken, responseData.data.refreshToken)
      return true
    }
    return false
  } catch (error) {
    const authStore = useAuthStore()
    authStore.logout()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return false
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers }
  })

  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = doRefreshToken().finally(() => {
        isRefreshing = false
      })
    }

    const refreshSuccess = await refreshPromise
    if (refreshSuccess) {
      // Retry with new headers
      response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers }
      })
    }
  }

  return response
}

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      let url = `${BASE_URL}${endpoint}`
      if (params) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            searchParams.append(key, String(value))
          }
        })
        const queryString = searchParams.toString()
        if (queryString) url += `?${queryString}`
      }
      const response = await fetchWithAuth(url, { method: 'GET' })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function post<T>(endpoint: string, body?: unknown): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function put<T>(endpoint: string, body?: unknown): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function del<T>(endpoint: string): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
      })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, get, post, put, del }
}
