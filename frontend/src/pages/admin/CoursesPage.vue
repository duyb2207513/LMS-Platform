<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import CourseThumbnail from '@/components/course/CourseThumbnail.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { AdminListResponse, ApiResponse, Course, CourseStatus } from '@/types'
const api = useApi(), items = ref<Course[]>([]), search = ref(''), status = ref(''), error = ref(''), message = ref(''), updatingId = ref(''), page = ref(1)
const PAGE_SIZE = 8
const published = computed(() => items.value.filter((course) => course.status === 'PUBLISHED').length)
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / PAGE_SIZE)))
const paginatedItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return items.value.slice(start, start + PAGE_SIZE)
})

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }
}

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
async function load() {
  error.value = ''
  page.value = 1
  try {
    const response = await api.get<AdminListResponse<Course>>('/admin/courses', { search: search.value.trim(), status: status.value, limit: 100 })
    items.value = response.data?.items || []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải khóa học'
  }
}
async function update(item: Course, next: CourseStatus) { updatingId.value = item.id; error.value = ''; try { const response = await api.patch<ApiResponse<Course>>(`/admin/courses/${item.id}`, { status: next }); if (response.data) Object.assign(item, response.data); message.value = `Đã cập nhật “${item.title}”.` } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Không thể cập nhật' } finally { updatingId.value = '' } }
onMounted(load)
</script>

<template><AdminLayout><main class="app-page"><header><p class="text-sm font-bold uppercase tracking-[.14em] text-purple-600">Kiểm duyệt nội dung</p><h1 class="app-page-title mt-2">Quản lý khóa học</h1><p class="app-page-description">Theo dõi chất lượng và điều chỉnh trạng thái xuất bản.</p></header><section class="mt-7 grid gap-4 sm:grid-cols-3"><article class="course-metric"><span>Đang hiển thị</span><b>{{ items.length }}</b></article><article class="course-metric"><span>Đã xuất bản</span><b>{{ published }}</b></article><article class="course-metric"><span>Chưa công khai</span><b>{{ items.length - published }}</b></article></section><section class="surface-card mt-6 p-4"><form class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]" @submit.prevent="load"><input v-model="search" class="admin-control" placeholder="Tìm theo tên khóa học..."/><select v-model="status" class="admin-control" @change="load"><option value="">Mọi trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã xuất bản</option><option value="ARCHIVED">Đã lưu trữ</option></select><BaseButton type="submit">Tìm kiếm</BaseButton></form></section><p v-if="error" class="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ error }}</p><p v-if="message" class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{{ message }}</p><LoadingSpinner v-if="api.loading.value && !items.length" class="py-20"/><section v-else-if="paginatedItems.length" class="mt-6 grid gap-5 xl:grid-cols-2"><article v-for="course in paginatedItems" :key="course.id" class="course-admin-card"><CourseThumbnail :src="course.thumbnailUrl" :alt="course.title" class="course-admin-card__image"/><div class="flex min-w-0 flex-1 flex-col p-5"><div class="flex items-start justify-between gap-3"><StatusBadge :status="course.status"/><span class="text-xs font-bold text-slate-400">{{ course.level }}</span></div><h2 class="mt-3 line-clamp-2 text-lg font-extrabold">{{ course.title }}</h2><p class="mt-2 line-clamp-1 text-sm text-slate-500">{{ course.instructor?.fullName }} · {{ course.category?.name }}</p><div class="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><b class="text-purple-700 dark:text-purple-300">{{ course.isFree ? 'Miễn phí' : money(course.price) }}</b><select :value="course.status" class="admin-control w-auto min-w-36" :disabled="updatingId === course.id" @change="update(course, ($event.target as HTMLSelectElement).value as CourseStatus)"><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="ARCHIVED">Lưu trữ</option></select></div></div></article></section><section v-else-if="!api.loading.value" class="surface-card mt-6 py-16 text-center text-sm text-slate-500">Không tìm thấy khóa học phù hợp.</section>

<nav v-if="paginatedItems.length > 0" class="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang">
  <button
    :disabled="page <= 1"
    class="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    @click="goToPage(page - 1)"
  >
    ← Trước
  </button>
  <button
    v-for="p in totalPages"
    :key="p"
    :class="[
      'grid h-10 w-10 place-items-center rounded-xl border text-sm font-bold transition',
      p === page
        ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-500/20'
        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
    ]"
    @click="goToPage(p)"
  >
    {{ p }}
  </button>
  <button
    :disabled="page >= totalPages"
    class="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    @click="goToPage(page + 1)"
  >
    Sau →
  </button>
</nav>
</main></AdminLayout></template>

<style scoped>.course-metric{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:1.1rem;background:var(--surface);padding:1rem 1.2rem}.course-metric span{font-size:.8rem;color:var(--text-muted)}.course-metric b{font-size:1.3rem}.admin-control{min-height:2.75rem;width:100%;border:1px solid var(--border);border-radius:.8rem;background:var(--surface-muted);padding:.65rem .85rem;color:var(--text);font-size:.82rem;outline:none}.admin-control:focus{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.1)}.course-admin-card{display:flex;min-height:14rem;overflow:hidden;border:1px solid var(--border);border-radius:1.25rem;background:var(--surface);box-shadow:var(--shadow-sm)}.course-admin-card__image{width:38%;min-width:11rem;aspect-ratio:auto}@media(max-width:640px){.course-admin-card{display:block}.course-admin-card__image{width:100%;min-width:0;aspect-ratio:16/7}}</style>
