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
      if (filters?.sortBy) params.sortBy = filters.sortBy
      if (filters?.sortOrder) params.sortOrder = filters.sortOrder
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
      // Backend giới hạn tối đa 50 bản ghi cho mỗi trang. Lấy trang đầu
      // rồi ghép các trang còn lại để màn hình vẫn hiển thị đủ khóa học.
      const firstPage = await api.get<PaginatedResponse<Course>>('/instructor/courses', { page: 1, limit: 50 })
      const allCourses = [...(firstPage.data || [])]
      const totalPages = firstPage.meta?.totalPages || 1

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get<PaginatedResponse<Course>>('/instructor/courses', { page: index + 2, limit: 50 }),
          ),
        )
        remainingPages.forEach((response) => allCourses.push(...(response.data || [])))
      }

      myCourses.value = allCourses
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
        myCourses.value[index] = { ...myCourses.value[index], ...response.data }
      }
      if (currentCourse.value?.id === id) {
        currentCourse.value = { ...currentCourse.value, ...response.data }
      }
    }
    return response
  }

  async function uploadCourseThumbnail(id: string, file: File) {
    const body = new FormData()
    body.append('thumbnail', file)
    const response = await useApi().post<ApiResponse<{ thumbnailUrl: string }>>(`/courses/${id}/thumbnail`, body)
    if (response.data) {
      const course = myCourses.value.find((item) => item.id === id)
      if (course) course.thumbnailUrl = response.data.thumbnailUrl
      if (currentCourse.value?.id === id) currentCourse.value.thumbnailUrl = response.data.thumbnailUrl
    }
    return response
  }

  async function publishCourse(id: string) {
    return useApi().post<ApiResponse<Course>>(`/courses/${id}/publish`)
  }

  async function updateCourseStatus(id: string, status: CourseStatus) {
    const api = useApi()
    const response = status === CourseStatus.PUBLISHED
      ? await api.post<ApiResponse<Course>>(`/courses/${id}/publish`)
      : status === CourseStatus.DRAFT
        ? await api.post<ApiResponse<Course>>(`/courses/${id}/unpublish`)
        : await api.post<ApiResponse<Course>>(`/courses/${id}/archive`)
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
    uploadCourseThumbnail,
    publishCourse,
    updateCourseStatus,
  }
})
