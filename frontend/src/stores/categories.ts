import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category, ApiResponse, CategoryFormData } from '@/types'
import { useApi } from '@/composables/useApi'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const response = await api.get<ApiResponse<Category[]>>('/categories')
      if (response.data) {
        categories.value = response.data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch categories'
    } finally {
      loading.value = false
    }
  }

  async function createCategory(data: CategoryFormData) {
    const api = useApi()
    const response = await api.post<ApiResponse<Category>>('/categories', data)
    if (response.data) {
      categories.value.push(response.data)
    }
    return response
  }

  async function updateCategory(id: string, data: CategoryFormData) {
    const api = useApi()
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data)
    if (response.data) {
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data
      }
    }
    return response
  }

  async function deleteCategory(id: string) {
    const api = useApi()
    const response = await api.del<ApiResponse>(`/categories/${id}`)
    categories.value = categories.value.filter((c) => c.id !== id)
    return response
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
})
