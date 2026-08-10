import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Course, ApiResponse, PaginatedResponse, CourseFormData, CourseFilters } from '@/types'
import { CourseStatus } from '@/types'
import { useApi } from '@/composables/useApi'

export const useCourseStore = defineStore('courses', () => {
  const courses = ref<Course[]>([])
  const currentCourse = ref<Course | null>(null)
  const myCourses = ref<Course[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  })

  async function fetchCourses(filters?: CourseFilters) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const params: Record<string, string | number | boolean | undefined> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.categoryId) params.categoryId = filters.categoryId
      if (filters?.level) params.level = filters.level
      if (filters?.isFree !== undefined) params.isFree = filters.isFree
      if (filters?.page) params.page = filters.page
      if (filters?.limit) params.limit = filters.limit

      const response = await api.get<PaginatedResponse<Course>>('/courses', params)
      courses.value = response.data || []
      if (response.meta) {
        meta.value = {
          total: response.meta.totalItems ?? response.meta.total ?? 0,
          page: response.meta.page,
          limit: response.meta.limit,
          totalPages: response.meta.totalPages,
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch courses'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourseBySlug(slug: string) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const response = await api.get<ApiResponse<Course>>(`/courses/${slug}`)
      if (response.data) {
        currentCourse.value = response.data
      }
      return response
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch course'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMyCourses() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const response = await api.get<PaginatedResponse<Course>>('/instructor/courses', { limit: 100 })
      myCourses.value = response.data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch my courses'
      myCourses.value = []
    } finally {
      loading.value = false
    }
  }

  async function createCourse(data: CourseFormData) {
    const api = useApi()
    const response = await api.post<ApiResponse<Course>>('/courses', data)
    if (response.data) {
      myCourses.value.unshift(response.data)
    }
    return response
  }

  async function updateCourse(id: string, data: Partial<CourseFormData>) {
    const api = useApi()
    const response = await api.patch<ApiResponse<Course>>(`/courses/${id}`, data)
    if (response.data) {
      const index = myCourses.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        myCourses.value[index] = response.data
      }
      if (currentCourse.value?.id === id) {
        currentCourse.value = response.data
      }
    }
    return response
  }

  async function publishCourse(id: string) {
    return useApi().post<ApiResponse<Course>>(`/courses/${id}/publish`)
  }

  async function updateCourseStatus(id: string, status: CourseStatus) {
    const api = useApi()
    const response = status === CourseStatus.PUBLISHED ? await api.post<ApiResponse<Course>>(`/courses/${id}/publish`) : status === CourseStatus.DRAFT ? await api.post<ApiResponse<Course>>(`/courses/${id}/unpublish`) : await api.patch<ApiResponse<Course>>(`/courses/${id}`, { status } as any)
    if (response.data) {
      const index = myCourses.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        myCourses.value[index] = response.data
      }
      if (currentCourse.value?.id === id) {
        currentCourse.value = response.data
      }
    }
    return response
  }

  return {
    courses,
    currentCourse,
    myCourses,
    loading,
    error,
    meta,
    fetchCourses,
    fetchCourseBySlug,
    fetchMyCourses,
    createCourse,
    updateCourse,
    publishCourse,
    updateCourseStatus,
  }
})
