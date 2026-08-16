<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PayoutHistoryTable from '@/components/revenue/PayoutHistoryTable.vue'
import { usePayoutApi, type InstructorBalance } from '@/api/payout.api'
import type { Payout } from '@/types/commerce'
import { formatMoney } from '@/utils/formatters'

const payoutApi = usePayoutApi()
const balances = ref<InstructorBalance[]>([])
const payouts = ref<Payout[]>([])
const activeTab = ref<'balances' | 'payouts'>('balances')

const selectedInstructor = ref<InstructorBalance | null>(null)
const creatingPayout = ref(false)
const processingPayoutId = ref<string | null>(null)
const error = ref('')

async function loadData() {
  try {
    const resB = await payoutApi.getInstructorBalances()
    balances.value = resB.data || []
    const resP = await payoutApi.getAdminPayouts()
    payouts.value = resP.data || []
  } catch (err: any) {
    console.error(err)
  }
}

async function handleCreatePayout(inst: InstructorBalance) {
  selectedInstructor.value = inst
  creatingPayout.value = true
  error.value = ''
  try {
    const res = await payoutApi.createPayoutSandbox(inst.instructorId, inst.earningIds)
    if (res.data?.id) {
      await processPayout(res.data.id)
    }
    await loadData()
  } catch (err: any) {
    error.value = err?.message || 'Tạo payout thất bại'
  } finally {
    creatingPayout.value = false
    selectedInstructor.value = null
  }
}

async function processPayout(id: string) {
  processingPayoutId.value = id
  try {
    await payoutApi.processPayoutSandbox(id)
    await loadData()
  } catch (err: any) {
    alert(err?.message || 'Xử lý payout thất bại')
  } finally {
    processingPayoutId.value = null
  }
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Quản lý Payout (Giả lập Sandbox)</h1>
          <p class="text-xs text-slate-500">Giả lập giải ngân thu nhập khả dụng cho các Giảng viên</p>
        </div>
      </header>

      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          :class="['px-4 py-2.5 text-sm font-bold border-b-2 transition-colors', activeTab === 'balances' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']"
          @click="activeTab = 'balances'"
        >
          Số dư Giảng viên ({{ balances.length }})
        </button>
        <button
          :class="['px-4 py-2.5 text-sm font-bold border-b-2 transition-colors', activeTab === 'payouts' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white']"
          @click="activeTab = 'payouts'"
        >
          Lịch sử Payouts ({{ payouts.length }})
        </button>
      </div>

      <div v-if="activeTab === 'balances'" class="surface-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th class="px-5 py-3.5">Giảng viên</th>
                <th class="px-5 py-3.5">Email</th>
                <th class="px-5 py-3.5 text-right">Số dư đang chờ (Pending)</th>
                <th class="px-5 py-3.5 text-right">Số dư khả dụng (Available)</th>
                <th class="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-if="payoutApi.loading.value">
                <td colspan="5" class="p-8 text-center text-slate-400">Đang tải danh sách số dư...</td>
              </tr>
              <tr v-else-if="!balances.length">
                <td colspan="5" class="p-8 text-center text-slate-400">Không có giảng viên nào có số dư</td>
              </tr>
              <tr v-for="b in balances" :key="b.instructorId" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">
                  {{ b.instructorName }}
                </td>
                <td class="px-5 py-4 text-xs font-mono text-slate-500">
                  {{ b.email }}
                </td>
                <td class="px-5 py-4 text-right font-medium text-amber-600 dark:text-amber-400">
                  {{ formatMoney(b.pendingBalance, b.currency) }}
                </td>
                <td class="px-5 py-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                  {{ formatMoney(b.availableBalance, b.currency) }}
                </td>
                <td class="px-5 py-4 text-right">
                  <BaseButton
                    size="sm"
                    :disabled="b.availableBalance <= 0 || (creatingPayout && selectedInstructor?.instructorId === b.instructorId)"
                    :loading="creatingPayout && selectedInstructor?.instructorId === b.instructorId"
                    @click="handleCreatePayout(b)"
                  >
                    Tạo Payout Sandbox
                  </BaseButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else>
        <PayoutHistoryTable :items="payouts" :loading="payoutApi.loading.value" />
      </div>
    </div>
  </AdminLayout>
</template>
