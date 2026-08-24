<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Certificate } from '@/types'

const route = useRoute()
const router = useRouter()
const api = useApi()
const code = ref(String(route.params.code || ''))
const certificate = ref<(Certificate & { isValid?: boolean }) | null>(null)
const error = ref('')
const searched = ref(false)

async function verify() {
  const normalized = code.value.trim()
  if (!normalized) return
  error.value = ''
  searched.value = true
  try {
    const response = await api.get<ApiResponse<Certificate & { isValid?: boolean }>>(`/certificates/verify/${encodeURIComponent(normalized)}`)
    certificate.value = response.data || null
    if (route.params.code !== normalized) await router.replace(`/certificates/verify/${encodeURIComponent(normalized)}`)
  } catch (cause) {
    certificate.value = null
    error.value = cause instanceof Error ? cause.message : 'Không tìm thấy chứng chỉ'
  }
}
onMounted(() => { if (code.value) void verify() })
</script>

<template>
  <DefaultLayout>
    <main class="verify-page">
      <section class="verify-search">
        <p class="verify-eyebrow">TRA CỨU CÔNG KHAI</p>
        <h1>Xác minh chứng chỉ</h1>
        <p>Nhập mã trên chứng chỉ để đối chiếu trực tiếp với dữ liệu phát hành của hệ thống.</p>
        <form @submit.prevent="verify">
          <label for="certificate-code">Mã xác minh</label>
          <div class="verify-input-row">
            <input id="certificate-code" v-model="code" placeholder="Ví dụ: CERT-2026-001" autocomplete="off">
            <BaseButton class="!rounded-none" type="submit" size="lg" :loading="api.loading.value">Kiểm tra</BaseButton>
          </div>
        </form>
      </section>
      <section class="verify-result" aria-live="polite">
        <div v-if="error" class="verify-error"><b>Không xác minh được chứng chỉ</b><span>{{ error }}</span></div>
        <article v-else-if="certificate" :class="['certificate-result', certificate.revokedAt ? 'certificate-result--revoked' : 'certificate-result--valid']">
          <div class="certificate-state"><span>{{ certificate.revokedAt ? '×' : '✓' }}</span><div><p>{{ certificate.revokedAt ? 'ĐÃ THU HỒI' : 'ĐÃ XÁC THỰC' }}</p><h2>{{ certificate.revokedAt ? 'Chứng chỉ không còn hiệu lực' : 'Chứng chỉ hợp lệ' }}</h2></div></div>
          <div class="certificate-course"><small>KHÓA HỌC</small><h3>{{ certificate.courseTitleSnapshot }}</h3></div>
          <dl>
            <div><dt>Học viên</dt><dd>{{ certificate.studentNameSnapshot }}</dd></div>
            <div><dt>Giảng viên</dt><dd>{{ certificate.instructorNameSnapshot }}</dd></div>
            <div><dt>Mã chứng chỉ</dt><dd class="font-mono">{{ certificate.certificateNumber }}</dd></div>
            <div><dt>Ngày cấp</dt><dd>{{ new Date(certificate.issuedAt).toLocaleDateString('vi-VN') }}</dd></div>
          </dl>
        </article>
        <div v-else class="verify-empty"><span>✓</span><h2>Sẵn sàng xác minh</h2><p>Mã xác minh thường nằm ở cuối chứng chỉ của bạn.</p></div>
      </section>
    </main>
  </DefaultLayout>
</template>

<style scoped>
.verify-page { display:grid; min-height:calc(100vh - 4.5rem); background:var(--surface); }
.verify-search { display:flex; flex-direction:column; justify-content:center; border-bottom:1px solid var(--border); padding:clamp(2rem,7vw,6rem); background:#5b21b6; color:white; }
.verify-eyebrow { font-size:.72rem!important; font-weight:900; letter-spacing:.18em; color:#ddd6fe!important; }
.verify-search h1 { margin-top:.65rem; font-size:clamp(2.5rem,5vw,4.75rem); font-weight:950; letter-spacing:-.055em; line-height:1; }
.verify-search>p { margin-top:1rem; max-width:34rem; color:#ede9fe; line-height:1.7; }
.verify-search form { margin-top:2.25rem; max-width:38rem; }
.verify-search label { display:block; margin-bottom:.5rem; font-size:.75rem; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
.verify-input-row { display:grid; grid-template-columns:minmax(0,1fr) auto; }
.verify-input-row input { min-width:0; border:0; border-right:1px solid #ddd6fe; padding:0 1rem; color:#111827; outline:none; }
.verify-input-row input:focus { box-shadow:inset 0 0 0 2px #a78bfa; }
.verify-result { display:grid; place-items:center; padding:clamp(1.5rem,5vw,4rem); }
.certificate-result,.verify-error,.verify-empty { width:min(100%,46rem); border:1px solid var(--border); background:var(--surface); }
.certificate-state { display:flex; align-items:center; gap:1rem; border-bottom:1px solid var(--border); padding:1.5rem; }
.certificate-state>span,.verify-empty>span { display:grid; width:3rem; height:3rem; place-items:center; border:2px solid currentColor; font-size:1.5rem; font-weight:950; }
.certificate-state p { font-size:.68rem; font-weight:900; letter-spacing:.15em; }
.certificate-state h2 { margin-top:.15rem; font-size:1.35rem; font-weight:950; }
.certificate-result--valid .certificate-state { color:#047857; }
.certificate-result--revoked .certificate-state { color:#b91c1c; }
.certificate-course { padding:1.5rem; }
.certificate-course small { color:var(--text-muted); font-weight:900; letter-spacing:.13em; }
.certificate-course h3 { margin-top:.45rem; font-size:1.5rem; font-weight:900; }
.certificate-result dl { display:grid; border-top:1px solid var(--border); }
.certificate-result dl>div { padding:1rem 1.5rem; border-bottom:1px solid var(--border); }
.certificate-result dt { color:var(--text-muted); font-size:.75rem; }
.certificate-result dd { margin-top:.2rem; font-weight:800; }
.verify-error,.verify-empty { padding:2rem; text-align:center; }
.verify-error { border-color:#fecaca; color:#b91c1c; }
.verify-error span { display:block; margin-top:.5rem; font-size:.85rem; }
.verify-empty span { margin:auto; color:#7c3aed; }
.verify-empty h2 { margin-top:1rem; font-weight:900; }
.verify-empty p { margin-top:.35rem; color:var(--text-muted); font-size:.85rem; }
@media (min-width:960px) { .verify-page { grid-template-columns:minmax(0,1fr) minmax(28rem,.9fr); } .verify-search { border-right:1px solid #6d28d9; border-bottom:0; } .certificate-result dl { grid-template-columns:repeat(2,1fr); } .certificate-result dl>div:nth-child(odd) { border-right:1px solid var(--border); } }
@media (max-width:520px) { .verify-input-row { grid-template-columns:1fr; gap:.5rem; } .verify-input-row input { min-height:3rem; border-right:0; } }
</style>
