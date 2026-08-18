<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()
const normalized = computed(() => props.status.toUpperCase())
const label = computed(() => ({
  PENDING: 'Chờ xử lý', PAID: 'Đã thanh toán', SUCCEEDED: 'Thành công', CANCELLED: 'Đã hủy', FAILED: 'Thất bại',
  ACTIVE: 'Hoạt động', BLOCKED: 'Đã khóa', DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ',
  STUDENT: 'Học viên', INSTRUCTOR: 'Giảng viên', ADMIN: 'Quản trị viên', COMPLETED: 'Hoàn thành',
}[normalized.value] || props.status))
const tone = computed(() => {
  if (['PAID', 'SUCCEEDED', 'ACTIVE', 'PUBLISHED', 'COMPLETED'].includes(normalized.value)) return 'success'
  if (['CANCELLED', 'FAILED', 'BLOCKED'].includes(normalized.value)) return 'danger'
  if (['PENDING', 'DRAFT'].includes(normalized.value)) return 'warning'
  if (['ADMIN', 'INSTRUCTOR'].includes(normalized.value)) return 'brand'
  return 'neutral'
})
</script>

<template>
  <span :class="['status-badge', `status-badge--${tone}`]"><span class="status-badge__dot" />{{ label }}</span>
</template>

<style scoped>
.status-badge{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;padding:.35rem .65rem;font-size:.7rem;font-weight:800;white-space:nowrap}.status-badge__dot{width:.38rem;height:.38rem;border-radius:50%;background:currentColor}.status-badge--success{background:#d1fae5;color:#047857}.status-badge--danger{background:#fee2e2;color:#b91c1c}.status-badge--warning{background:#fef3c7;color:#b45309}.status-badge--brand{background:#ede9fe;color:#6d28d9}.status-badge--neutral{background:#f1f5f9;color:#475569}:global(.dark) .status-badge--success{background:rgba(6,78,59,.45);color:#6ee7b7}:global(.dark) .status-badge--danger{background:rgba(127,29,29,.4);color:#fca5a5}:global(.dark) .status-badge--warning{background:rgba(120,53,15,.4);color:#fcd34d}:global(.dark) .status-badge--brand{background:rgba(88,28,135,.45);color:#d8b4fe}:global(.dark) .status-badge--neutral{background:#1e293b;color:#cbd5e1}
</style>
