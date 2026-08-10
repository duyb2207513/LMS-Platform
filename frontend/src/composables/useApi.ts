import { ref } from 'vue'

const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const BASE_URL = configuredBaseUrl.endsWith('/api/v1') ? configuredBaseUrl : `${configuredBaseUrl}/api/v1`

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
  if (response.status === 204) return undefined as T
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`)
  }
  return data
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
      const response = await fetch(url, { headers: getAuthHeaders() })
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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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

  async function patch<T>(endpoint: string, body?: unknown): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH', headers: getAuthHeaders(), body: body ? JSON.stringify(body) : undefined,
      })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally { loading.value = false }
  }

  async function del<T>(endpoint: string): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return await handleResponse<T>(response)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, get, post, put, patch, del }
}
