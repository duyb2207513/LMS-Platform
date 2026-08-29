<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Certificate } from '@/types'
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  Printer,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const api = useApi()

const code = ref(String(route.params.code || ''))
const certificate = ref<Certificate | null>(null)
const isValid = ref(false)
const error = ref('')
const searched = ref(false)
const copied = ref(false)

async function verify() {
  const normalized = code.value.trim()
  if (!normalized) return
  error.value = ''
  searched.value = true
  try {
    const response = await api.get<ApiResponse<{ valid: boolean; certificate: Certificate } | Certificate>>(
      `/certificates/verify/${encodeURIComponent(normalized)}`
    )
    const data = response.data as any
    if (data && typeof data === 'object') {
      if ('certificate' in data) {
        certificate.value = data.certificate
        isValid.value = Boolean(data.valid)
      } else {
        certificate.value = data
        isValid.value = !data.revokedAt
      }
    } else {
      certificate.value = null
      isValid.value = false
    }

    if (route.params.code !== normalized) {
      await router.replace(`/certificates/verify/${encodeURIComponent(normalized)}`)
    }
  } catch (cause) {
    certificate.value = null
    isValid.value = false
    error.value = cause instanceof Error ? cause.message : 'Không tìm thấy chứng chỉ với mã đã nhập'
  }
}

function formatDate(val?: string) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

function copyVerifyLink() {
  if (!certificate.value) return
  const url = window.location.href
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2500)
}

function printCertificate() {
  window.print()
}

watch(
  () => route.params.code,
  (newCode) => {
    if (newCode && String(newCode) !== code.value) {
      code.value = String(newCode)
      void verify()
    }
  }
)

onMounted(() => {
  if (code.value) void verify()
})
</script>

<template>
  <DefaultLayout>
    <div class="min-h-[calc(100vh-4.5rem)] bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Ambient Aurora Glow Behind Certificate -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/25 blur-[140px]" />
        <div class="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div class="absolute bottom-10 left-10 h-[400px] w-[400px] rounded-full bg-emerald-600/15 blur-[140px]" />
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]" />
      </div>

      <div class="relative mx-auto max-w-5xl">
        <!-- Top Title & Description Header -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-xs font-bold text-purple-300 backdrop-blur-md shadow-xs shadow-purple-500/10 mb-4">
            <ShieldCheck :size="15" class="text-purple-400" />
            <span>Hệ thống Tra cứu &amp; Xác thực Chứng chỉ số Công khai</span>
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Xác minh Chứng chỉ LMS
          </h1>
          <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Đối chiếu mã định danh chứng chỉ với cơ sở dữ liệu phát hành chính thức để kiểm tra tính hợp lệ và thông tin người thụ hưởng.
          </p>

          <!-- Search Form Bar -->
          <div class="mt-8 max-w-2xl mx-auto">
            <form @submit.prevent="verify" class="relative flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-purple-500/60 focus-within:ring-4 focus-within:ring-purple-500/15">
              <div class="pl-3 text-slate-400">
                <Search :size="20" />
              </div>
              <input
                id="certificate-code"
                v-model="code"
                type="text"
                placeholder="Nhập mã chứng chỉ (Ví dụ: LMS-2026-..., mã verification hoặc slug)"
                class="flex-1 bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 outline-none"
                autocomplete="off"
              />
              <button
                type="submit"
                :disabled="api.loading.value || !code.trim()"
                class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="api.loading.value" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span v-else>Kiểm tra</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Verification Results Area -->
        <div v-if="api.loading.value" class="py-16 text-center">
          <LoadingSpinner />
          <p class="mt-4 text-sm font-bold text-slate-400">Đang tra cứu dữ liệu chứng chỉ trên hệ thống...</p>
        </div>

        <!-- ERROR STATE -->
        <div
          v-else-if="error"
          class="rounded-3xl border border-red-500/30 bg-red-950/40 p-8 text-center backdrop-blur-xl shadow-xl max-w-xl mx-auto"
        >
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/20 text-red-400">
            <ShieldAlert :size="28" />
          </div>
          <h2 class="mt-4 text-lg font-bold text-white">Không tìm thấy chứng chỉ</h2>
          <p class="mt-1 text-sm text-red-200/80">{{ error }}</p>
          <p class="mt-4 text-xs text-slate-400">Vui lòng kiểm tra lại chính xác từng ký tự mã chứng chỉ hoặc liên hệ với giảng viên để được hỗ trợ.</p>
        </div>

        <!-- VALID CERTIFICATE RESULT DISPLAY -->
        <div v-else-if="certificate" class="space-y-6">
          <!-- Status Banner -->
          <div
            :class="[
              'rounded-2xl border p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl',
              isValid && !certificate.revokedAt
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200 shadow-emerald-950/30'
                : 'border-red-500/30 bg-red-950/40 text-red-200 shadow-red-950/30'
            ]"
          >
            <div class="flex items-center gap-3.5">
              <div
                :class="[
                  'grid h-12 w-12 shrink-0 place-items-center rounded-xl font-bold',
                  isValid && !certificate.revokedAt
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                ]"
              >
                <CheckCircle2 v-if="isValid && !certificate.revokedAt" :size="24" />
                <ShieldAlert v-else :size="24" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10">
                    {{ isValid && !certificate.revokedAt ? 'ĐÃ XÁC THỰC' : 'ĐÃ THU HỒI' }}
                  </span>
                  <span class="text-xs text-slate-400">ID: {{ certificate.certificateNumber }}</span>
                </div>
                <h2 class="text-base sm:text-lg font-bold text-white mt-0.5">
                  {{ isValid && !certificate.revokedAt ? 'Chứng chỉ hợp lệ & Đã được phát hành chính thức' : 'Chứng chỉ đã bị thu hồi hoặc không còn hiệu lực' }}
                </h2>
              </div>
            </div>

            <!-- Quick Action Toolbar -->
            <div class="flex items-center gap-2 print:hidden">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                @click="copyVerifyLink"
              >
                <Check v-if="copied" :size="15" class="text-emerald-400" />
                <Copy v-else :size="15" />
                <span>{{ copied ? 'Đã sao chép link' : 'Sao chép link' }}</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                @click="printCertificate"
              >
                <Printer :size="15" />
                <span>In / Lưu PDF</span>
              </button>
            </div>
          </div>

          <!-- Digital Certificate Canvas Frame -->
          <div class="certificate-canvas relative rounded-3xl border-2 border-amber-400/40 bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/80 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-purple-950/60 overflow-hidden">
            <!-- Guilloche Pattern Background -->
            <div class="certificate-guilloche-border pointer-events-none absolute inset-4 rounded-2xl border border-dashed border-amber-400/30" />
            <div class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div class="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

            <!-- Royal Seal Badge Top Right -->
            <div class="absolute right-6 top-6 sm:right-10 sm:top-10 flex flex-col items-center">
              <div class="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-full border-2 border-amber-400 bg-amber-400/10 text-amber-300 shadow-xl shadow-amber-500/20 backdrop-blur-md">
                <Award :size="32" />
              </div>
              <span class="mt-1 text-[9px] font-mono font-black uppercase tracking-widest text-amber-300/80">LMS VERIFIED</span>
            </div>

            <!-- Certificate Header -->
            <div class="relative z-10 max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-amber-400" />
                <span class="text-xs font-black uppercase tracking-[0.25em] text-amber-400">CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC</span>
              </div>
              <p class="mt-1 text-xs font-mono tracking-widest text-slate-400 uppercase">Certificate of Completion</p>
            </div>

            <!-- Certificate Body -->
            <div class="relative z-10 my-10 text-center">
              <p class="text-sm font-medium text-slate-400">Chứng nhận học viên</p>
              <h3 class="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 tracking-tight">
                {{ certificate.studentNameSnapshot || 'Học viên LMS' }}
              </h3>
              <p class="mt-4 text-sm font-medium text-slate-400">đã hoàn thành xuất sắc toàn bộ chương trình đào tạo chuyên sâu:</p>
              <h4 class="mt-3 text-xl sm:text-2xl lg:text-3xl font-extrabold text-purple-300">
                {{ certificate.courseTitleSnapshot || 'Khóa học lập trình' }}
              </h4>
            </div>

            <!-- Certificate Meta Footer Grid -->
            <div class="relative z-10 grid grid-cols-1 gap-6 border-t border-amber-400/20 pt-8 sm:grid-cols-3">
              <div>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <User :size="14" class="text-amber-400" /> Giảng viên phụ trách
                </span>
                <p class="mt-1.5 text-sm sm:text-base font-bold text-white">{{ certificate.instructorNameSnapshot || 'Giảng viên chuyên môn' }}</p>
              </div>

              <div>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Calendar :size="14" class="text-amber-400" /> Ngày cấp chứng chỉ
                </span>
                <p class="mt-1.5 text-sm sm:text-base font-bold text-white">{{ formatDate(certificate.issuedAt) }}</p>
              </div>

              <div>
                <span class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <ShieldCheck :size="14" class="text-amber-400" /> Mã số chứng chỉ
                </span>
                <p class="mt-1.5 text-xs sm:text-sm font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/40 rounded-lg px-2.5 py-1 inline-block">
                  {{ certificate.certificateNumber }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- DEFAULT EMPTY STATE -->
        <div
          v-else
          class="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center backdrop-blur-xl shadow-xl max-w-xl mx-auto"
        >
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Award :size="32" />
          </div>
          <h2 class="mt-4 text-xl font-bold text-white">Sẵn sàng tra cứu</h2>
          <p class="mt-2 text-sm text-slate-400 leading-relaxed">
            Nhập mã chứng chỉ (ví dụ: <code class="bg-white/10 px-2 py-0.5 rounded text-purple-300 font-mono text-xs">LMS-2026-...</code>) vào ô tìm kiếm ở trên để xác thực chứng chỉ số công khai.
          </p>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
@media print {
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  .certificate-canvas {
    border-color: #d97706 !important;
    background: #ffffff !important;
    color: #0f172a !important;
    box-shadow: none !important;
  }
}
</style>
