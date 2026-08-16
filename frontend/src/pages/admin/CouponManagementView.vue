<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCouponApi } from '@/api/coupon.api'
import { useCourseStore } from '@/stores/courses'
import type { Coupon, CouponUsage } from '@/types/commerce'
import { DiscountType } from '@/types/commerce'
import { formatMoney, formatDate } from '@/utils/formatters'

const couponApi = useCouponApi()
const courseStore = useCourseStore()

const coupons = ref<Coupon[]>([])
const filterStatus = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
const search = ref('')

const showModal = ref(false)
const editingCoupon = ref<Coupon | null>(null)
const formData = ref({
  code: '',
  name: '',
  description: '',
  discountType: DiscountType.PERCENTAGE,
  discountValue: 10,
  maxDiscountAmount: null as number | null,
  minOrderAmount: null as number | null,
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  maxRedemptions: null as number | null,
  appliesToAllCourses: true,
  courseIds: [] as string[],
  isActive: true,
})

const showUsagesModal = ref(false)
const selectedCouponUsages = ref<CouponUsage[]>([])
const selectedCouponCode = ref('')
const loadingUsages = ref(false)
const formError = ref('')

async function loadCoupons() {
  try {
    const res = await couponApi.getAdminCoupons({
      search: search.value || undefined,
      isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'ACTIVE',
    })
    coupons.value = res.data || []
  } catch (err: any) {
    console.error(err)
  }
}

function openCreateModal() {
  editingCoupon.value = null
  formData.value = {
    code: '',
    name: '',
    description: '',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: null,
    minOrderAmount: null,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    maxRedemptions: null,
    appliesToAllCourses: true,
    courseIds: [],
    isActive: true,
  }
  formError.value = ''
  showModal.value = true
}

function openEditModal(coupon: Coupon) {
  editingCoupon.value = coupon
  formData.value = {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description || '',
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountAmount: coupon.maxDiscountAmount || null,
    minOrderAmount: coupon.minOrderAmount || null,
    startsAt: new Date(coupon.startsAt).toISOString().slice(0, 16),
    expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 16),
    maxRedemptions: coupon.maxRedemptions || null,
    appliesToAllCourses: coupon.appliesToAllCourses,
    courseIds: coupon.courses?.map(c => c.id) || coupon.courseIds || [],
    isActive: coupon.isActive,
  }
  formError.value = ''
  showModal.value = true
}

async function handleSaveCoupon() {
  if (!formData.value.code || !formData.value.name || !formData.value.discountValue) {
    formError.value = 'Vui lòng nhập đầy đủ mã, tên và giá trị giảm giá'
    return
  }
  formError.value = ''
  try {
    const payload = {
      ...formData.value,
      code: formData.value.code.trim().toUpperCase(),
      startsAt: new Date(formData.value.startsAt).toISOString(),
      expiresAt: new Date(formData.value.expiresAt).toISOString(),
    }
    if (editingCoupon.value) {
      await couponApi.updateCoupon(editingCoupon.value.id, payload)
    } else {
      await couponApi.createCoupon(payload)
    }
    showModal.value = false
    await loadCoupons()
  } catch (err: any) {
    formError.value = err?.message || 'Không lưu được coupon'
  }
}

async function toggleStatus(coupon: Coupon) {
  try {
    await couponApi.toggleCouponStatus(coupon.id, !coupon.isActive)
    await loadCoupons()
  } catch (err: any) {
    alert(err?.message || 'Không thể đổi trạng thái')
  }
}

async function viewUsages(coupon: Coupon) {
  selectedCouponCode.value = coupon.code
  showUsagesModal.value = true
  loadingUsages.value = true
  try {
    const res = await couponApi.getCouponUsages(coupon.id)
    selectedCouponUsages.value = res.data || []
  } catch (err) {
    selectedCouponUsages.value = []
  } finally {
    loadingUsages.value = false
  }
}

onMounted(() => {
  loadCoupons()
  courseStore.fetchCourses()
})
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Quản lý Mã giảm giá (Coupons)</h1>
          <p class="text-xs text-slate-500">Tạo, chỉnh sửa và quản lý coupon ưu đãi cho khóa học</p>
        </div>
        <BaseButton @click="openCreateModal">+ Tạo Coupon mới</BaseButton>
      </header>

      <!-- Search and Filters -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-1 items-center gap-3 max-w-md">
          <input
            v-model="search"
            type="text"
            placeholder="Tìm theo mã hoặc tên..."
            class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            @keyup.enter="loadCoupons"
          />
          <BaseButton variant="secondary" size="sm" @click="loadCoupons">Tìm</BaseButton>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-for="st in ([['ALL','Tất cả'],['ACTIVE','Đang bật'],['INACTIVE','Đã tắt']] as const)"
            :key="st[0]"
            :class="['rounded-lg px-3 py-1.5 text-xs font-bold transition-colors', filterStatus === st[0] ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300']"
            @click="filterStatus = st[0]; loadCoupons()"
          >
            {{ st[1] }}
          </button>
        </div>
      </div>

      <!-- Coupons Table -->
      <div class="surface-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3.5">Mã Coupon</th>
                <th class="px-5 py-3.5">Loại & Giá trị</th>
                <th class="px-5 py-3.5">Phạm vi</th>
                <th class="px-5 py-3.5 text-center">Đã dùng</th>
                <th class="px-5 py-3.5">Thời hạn</th>
                <th class="px-5 py-3.5 text-center">Trạng thái</th>
                <th class="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-if="couponApi.loading.value">
                <td colspan="7" class="p-8 text-center text-slate-400">Đang tải danh sách coupon...</td>
              </tr>
              <tr v-else-if="!coupons.length">
                <td colspan="7" class="p-8 text-center text-slate-400">Không tìm thấy coupon phù hợp</td>
              </tr>
              <tr v-for="c in coupons" :key="c.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td class="px-5 py-4">
                  <div class="font-mono font-extrabold text-purple-700 dark:text-purple-300">{{ c.code }}</div>
                  <div class="text-xs text-slate-500">{{ c.name }}</div>
                </td>
                <td class="px-5 py-4 font-semibold">
                  <span v-if="c.discountType === DiscountType.PERCENTAGE" class="text-purple-600 dark:text-purple-400">
                    Giảm {{ c.discountValue }}%
                    <span v-if="c.maxDiscountAmount" class="block text-[11px] font-normal text-slate-400">
                      (Tối đa {{ formatMoney(c.maxDiscountAmount) }})
                    </span>
                  </span>
                  <span v-else class="text-emerald-600 dark:text-emerald-400">
                    Giảm {{ formatMoney(c.discountValue) }}
                  </span>
                </td>
                <td class="px-5 py-4 text-xs">
                  <span v-if="c.appliesToAllCourses" class="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Tất cả khóa học</span>
                  <span v-else class="rounded bg-purple-50 px-2 py-0.5 font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">{{ c.courses?.length || c.courseIds?.length || 0 }} khóa học</span>
                </td>
                <td class="px-5 py-4 text-center font-bold">
                  <button type="button" class="underline hover:text-purple-600" @click="viewUsages(c)">
                    {{ c.redeemedCount }} / {{ c.maxRedemptions || '∞' }}
                  </button>
                </td>
                <td class="px-5 py-4 text-xs font-mono text-slate-500">
                  <div>Từ: {{ formatDate(c.startsAt) }}</div>
                  <div>Đến: {{ formatDate(c.expiresAt) }}</div>
                </td>
                <td class="px-5 py-4 text-center">
                  <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold', c.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400']">
                    {{ c.isActive ? 'Bật' : 'Tắt' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right space-x-2">
                  <BaseButton size="sm" variant="secondary" @click="openEditModal(c)">Sửa</BaseButton>
                  <BaseButton size="sm" :variant="c.isActive ? 'ghost' : 'secondary'" @click="toggleStatus(c)">
                    {{ c.isActive ? 'Tắt' : 'Bật' }}
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <BaseModal
      :show="showModal"
      :title="editingCoupon ? 'Chỉnh sửa Coupon' : 'Tạo Coupon mới'"
      size="lg"
      @close="showModal = false"
    >
      <form class="space-y-4" @submit.prevent="handleSaveCoupon">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Mã Coupon *</label>
            <input
              v-model="formData.code"
              type="text"
              placeholder="VD: WELCOME20"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm uppercase font-mono font-bold focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Tên Coupon *</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Giảm 20% cho thành viên mới"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Mô tả</label>
          <textarea
            v-model="formData.description"
            rows="2"
            class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          ></textarea>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Loại giảm giá</label>
            <select
              v-model="formData.discountType"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option :value="DiscountType.PERCENTAGE">Phần trăm (%)</option>
              <option :value="DiscountType.FIXED_AMOUNT">Số tiền cố định (VND)</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Giá trị giảm *</label>
            <input
              v-model.number="formData.discountValue"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div v-if="formData.discountType === DiscountType.PERCENTAGE">
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Giảm tối đa (VND)</label>
            <input
              v-model.number="formData.maxDiscountAmount"
              type="number"
              placeholder="Để trống nếu không giới hạn"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Đơn hàng tối thiểu (VND)</label>
            <input
              v-model.number="formData.minOrderAmount"
              type="number"
              placeholder="0"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Tổng số lượt sử dụng tối đa</label>
            <input
              v-model.number="formData.maxRedemptions"
              type="number"
              placeholder="Để trống nếu không giới hạn"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Thời gian bắt đầu</label>
            <input
              v-model="formData.startsAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Thời gian hết hạn</label>
            <input
              v-model="formData.expiresAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <input v-model="formData.appliesToAllCourses" type="checkbox" class="h-4 w-4 rounded text-purple-600" />
            Áp dụng cho tất cả khóa học
          </label>
        </div>

        <div v-if="!formData.appliesToAllCourses">
          <label class="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Chọn khóa học áp dụng</label>
          <select
            v-model="formData.courseIds"
            multiple
            class="w-full h-32 rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option v-for="crs in courseStore.courses" :key="crs.id" :value="crs.id">
              {{ crs.title }}
            </option>
          </select>
        </div>

        <p v-if="formError" class="text-xs font-bold text-red-600">{{ formError }}</p>

        <div class="flex justify-end gap-3 pt-3">
          <BaseButton variant="secondary" type="button" @click="showModal = false">Hủy</BaseButton>
          <BaseButton type="submit" :loading="couponApi.loading.value">Lưu Coupon</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Usages History Modal -->
    <BaseModal
      :show="showUsagesModal"
      :title="`Lịch sử sử dụng: ${selectedCouponCode}`"
      size="lg"
      @close="showUsagesModal = false"
    >
      <LoadingSpinner v-if="loadingUsages" class="py-12" />
      <div v-else-if="!selectedCouponUsages.length" class="py-8 text-center text-slate-400">
        Chưa có người dùng nào áp dụng coupon này.
      </div>
      <div v-else class="max-h-96 overflow-y-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 font-bold text-slate-500 dark:bg-slate-800">
            <tr>
              <th class="p-3">Học viên</th>
              <th class="p-3">Mã đơn</th>
              <th class="p-3">Số tiền giảm</th>
              <th class="p-3">Thời gian</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="u in selectedCouponUsages" :key="u.id">
              <td class="p-3 font-semibold">{{ u.user?.name || u.userId }}</td>
              <td class="p-3 font-mono">{{ u.order?.orderNumber || u.orderId }}</td>
              <td class="p-3 font-bold text-emerald-600">{{ formatMoney(u.discountAmount) }}</td>
              <td class="p-3 text-slate-400">{{ formatDate(u.usedAt || u.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseModal>
  </AdminLayout>
</template>
