<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { ArrowLeft, CalendarDays, ClipboardList, Pencil, Plus, Repeat2, Trash2, Users } from '@lucide/vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, Assignment, CourseGradeRule } from '@/types'

const route = useRoute(), api = useApi(), courseId = String(route.params.courseId)
const items = ref<Assignment[]>([]), rule = ref<CourseGradeRule>({ courseId, assignmentWeight:60, quizWeight:40, passingScore:70 })
const error = ref(''), message = ref(''), showForm = ref(false), editingId = ref(''), saving = ref(false)
const title = ref(''), description = ref(''), instructions = ref(''), dueAt = ref(''), maxScore = ref('100'), allowResubmission = ref(false), maxSubmissions = ref('1'), allowLateSubmissions = ref(false), isPublished = ref(false)
const attachmentFiles = ref<File[]>([]), attachmentKey = ref(0)
const localDate = (date:string) => { const value=new Date(date); return new Date(value.getTime()-value.getTimezoneOffset()*60000).toISOString().slice(0,16) }
const formatDate = (date:string) => new Date(date).toLocaleString('vi-VN')
function resetForm(){ editingId.value='';title.value='';description.value='';instructions.value='';dueAt.value=localDate(new Date(Date.now()+86400000).toISOString());maxScore.value='100';allowResubmission.value=false;maxSubmissions.value='1';allowLateSubmissions.value=false;isPublished.value=false;attachmentFiles.value=[];attachmentKey.value+=1 }
function create(){ resetForm(); showForm.value=true }
function edit(item:Assignment){ editingId.value=item.id;title.value=item.title;description.value=item.description||'';instructions.value=item.instructions||'';dueAt.value=localDate(item.dueAt);maxScore.value=String(item.maxScore);allowResubmission.value=item.allowResubmission;maxSubmissions.value=String(item.maxSubmissions);allowLateSubmissions.value=item.allowLateSubmissions;isPublished.value=item.isPublished;attachmentFiles.value=[];attachmentKey.value+=1;showForm.value=true }
function chooseAttachments(event:Event){const files=Array.from((event.target as HTMLInputElement).files||[]);if(files.length>5){error.value='Chỉ được chọn tối đa 5 file.';return}if(files.some(file=>file.size>20*1024*1024)){error.value='Mỗi file không được vượt quá 20 MB.';return}attachmentFiles.value=files;error.value=''}
async function load(){ error.value='';try{const [assignments,gradeRule]=await Promise.all([api.get<ApiResponse<Assignment[]>>(`/courses/${courseId}/assignments`),api.get<ApiResponse<CourseGradeRule>>(`/courses/${courseId}/grades/rule`)]);items.value=assignments.data||[];if(gradeRule.data)rule.value=gradeRule.data}catch(cause){error.value=cause instanceof Error?cause.message:'Không thể tải bài tập'} }
async function save(){ saving.value=true;error.value='';try{const body={title:title.value.trim(),description:description.value.trim()||null,instructions:instructions.value.trim()||null,dueAt:new Date(dueAt.value).toISOString(),maxScore:Number(maxScore.value),allowResubmission:allowResubmission.value,maxSubmissions:allowResubmission.value?Number(maxSubmissions.value):1,allowLateSubmissions:allowLateSubmissions.value,isPublished:isPublished.value};const response=editingId.value?await api.patch<ApiResponse<Assignment>>(`/assignments/${editingId.value}`,body):await api.post<ApiResponse<Assignment>>(`/courses/${courseId}/assignments`,body);const assignmentId=response.data?.id||editingId.value;if(attachmentFiles.value.length&&assignmentId){const form=new FormData();attachmentFiles.value.forEach(file=>form.append('files',file));await api.post(`/assignments/${assignmentId}/attachments`,form)}showForm.value=false;message.value=editingId.value?'Đã cập nhật bài tập.':'Đã tạo bài tập.';await load()}catch(cause){error.value=cause instanceof Error?cause.message:'Không thể lưu bài tập'}finally{saving.value=false}}
async function remove(item:Assignment){if(!confirm(`Xóa bài tập “${item.title}”?`))return;try{await api.del(`/assignments/${item.id}`);await load()}catch(cause){error.value=cause instanceof Error?cause.message:'Không thể xóa bài tập'}}
async function saveRule(){error.value='';try{await api.put(`/courses/${courseId}/grades/rule`,{assignmentWeight:Number(rule.value.assignmentWeight),quizWeight:Number(rule.value.quizWeight),passingScore:Number(rule.value.passingScore)});message.value='Đã lưu quy tắc tính điểm.'}catch(cause){error.value=cause instanceof Error?cause.message:'Không thể lưu quy tắc điểm'}}
onMounted(load)
</script>

<template>
  <InstructorLayout>
    <main class="assignment-page w-full">
      <header class="assignment-header">
        <RouterLink to="/instructor/courses" class="assignment-back" aria-label="Quay lại khóa học">
          <ArrowLeft :size="18" />
        </RouterLink>
        <div class="assignment-heading">
          <div>
            <p class="assignment-eyebrow">Quản lý học tập</p>
            <h1>Bài tập và chấm điểm</h1>
            <p>Thiết lập hạn nộp, quản lý bài nộp và theo dõi kết quả học viên.</p>
          </div>
          <BaseButton class="assignment-create" @click="create"><Plus :size="17" /> Tạo bài tập</BaseButton>
        </div>
      </header>

      <p v-if="message" class="assignment-alert assignment-alert--success">{{ message }}</p>
      <p v-if="error" class="assignment-alert assignment-alert--error">{{ error }}</p>

      <section class="grade-panel">
        <div class="grade-panel__heading">
          <div>
            <h2>Quy tắc điểm tổng kết</h2>
            <p>Trọng số bài tập và Quiz phải có tổng bằng 100%.</p>
          </div>
          <BaseButton variant="secondary" class="grade-save" @click="saveRule">Lưu quy tắc</BaseButton>
        </div>
        <div class="grade-fields">
          <BaseInput id="assignment-weight" v-model="rule.assignmentWeight" type="number" label="Bài tập (%)" />
          <BaseInput id="quiz-weight" v-model="rule.quizWeight" type="number" label="Quiz (%)" />
          <BaseInput id="passing-score" v-model="rule.passingScore" type="number" label="Điểm đạt (%)" />
        </div>
      </section>

      <div class="assignment-list-heading">
        <div>
          <h2>Danh sách bài tập</h2>
          <p>{{ items.length }} bài tập trong khóa học</p>
        </div>
      </div>

      <LoadingSpinner v-if="api.loading.value && !items.length" class="py-20" />

      <section v-else-if="items.length" class="assignment-list">
        <article v-for="item in items" :key="item.id" class="assignment-row">
          <div class="assignment-row__main">
            <div class="assignment-row__title-line">
              <span :class="['assignment-status', item.isPublished ? 'assignment-status--published' : 'assignment-status--draft']">
                {{ item.isPublished ? 'Đã giao' : 'Bản nháp' }}
              </span>
              <strong>{{ item.maxScore }} điểm</strong>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description || 'Chưa có mô tả cho bài tập này.' }}</p>
          </div>

          <dl class="assignment-meta">
            <div><CalendarDays :size="17" /><span><dt>Hạn nộp</dt><dd>{{ formatDate(item.dueAt) }}</dd></span></div>
            <div><Users :size="17" /><span><dt>Bài đã nộp</dt><dd>{{ item._count?.submissions || 0 }} bài</dd></span></div>
            <div><Repeat2 :size="17" /><span><dt>Nộp lại</dt><dd>{{ item.allowResubmission ? `Tối đa ${item.maxSubmissions} lần` : 'Không' }}</dd></span></div>
          </dl>

          <div class="assignment-actions">
            <RouterLink :to="`/instructor/assignments/${item.id}/submissions`" class="assignment-grade-link">Xem và chấm bài</RouterLink>
            <button type="button" aria-label="Sửa bài tập" @click="edit(item)"><Pencil :size="17" /><span>Sửa</span></button>
            <button type="button" class="assignment-delete" aria-label="Xóa bài tập" @click="remove(item)"><Trash2 :size="17" /><span>Xóa</span></button>
          </div>
        </article>
      </section>

      <section v-else class="assignment-empty">
        <ClipboardList :size="42" stroke-width="1.5" />
        <h2>Chưa có bài tập</h2>
        <p>Tạo bài tập đầu tiên và đặt hạn nộp cho học viên.</p>
        <BaseButton @click="create"><Plus :size="17" /> Tạo bài tập</BaseButton>
      </section>

      <BaseModal :show="showForm" :title="editingId ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'" size="lg" @close="showForm = false">
        <form class="assignment-form space-y-4" @submit.prevent="save">
          <BaseInput id="assignment-title" v-model="title" label="Tên bài tập" required />
          <BaseTextarea id="assignment-description" v-model="description" label="Mô tả" :rows="3" />
          <BaseTextarea id="assignment-instructions" v-model="instructions" label="Hướng dẫn thực hiện" :rows="5" />
          <div class="border border-dashed border-slate-300 p-4">
            <label class="block cursor-pointer"><b class="text-sm">Hình ảnh và tài liệu đề bài</b><p class="mt-1 text-xs text-slate-500">Tối đa 5 file · mỗi file tối đa 20 MB · ảnh, PDF, Word, Excel, TXT hoặc ZIP</p><input :key="attachmentKey" type="file" multiple class="mt-3 block w-full text-sm" accept="image/jpeg,image/png,image/webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip" @change="chooseAttachments"></label>
            <ul v-if="attachmentFiles.length" class="mt-3 space-y-1 text-xs text-slate-600"><li v-for="file in attachmentFiles" :key="file.name">• {{ file.name }} · {{ (file.size / 1024 / 1024).toFixed(1) }} MB</li></ul>
          </div>
          <div class="grid gap-4 sm:grid-cols-2"><BaseInput id="assignment-due" v-model="dueAt" type="datetime-local" label="Hạn nộp" required /><BaseInput id="assignment-max" v-model="maxScore" type="number" label="Điểm tối đa" required /></div>
          <div class="grid gap-3 bg-slate-50 p-4 dark:bg-slate-800/50"><label class="flex items-center gap-3 text-sm font-semibold"><input v-model="allowResubmission" type="checkbox">Cho phép nộp lại</label><BaseInput v-if="allowResubmission" id="max-submissions" v-model="maxSubmissions" type="number" label="Số lần nộp tối đa" /><label class="flex items-center gap-3 text-sm font-semibold"><input v-model="allowLateSubmissions" type="checkbox">Cho phép nộp sau hạn</label><label class="flex items-center gap-3 text-sm font-semibold"><input v-model="isPublished" type="checkbox">Giao bài ngay cho học viên</label></div>
          <div class="flex justify-end gap-3 pt-2"><BaseButton variant="secondary" @click="showForm = false">Hủy</BaseButton><BaseButton type="submit" :loading="saving">{{ editingId ? 'Lưu thay đổi' : 'Tạo bài tập' }}</BaseButton></div>
        </form>
      </BaseModal>
    </main>
  </InstructorLayout>
</template>

<style scoped>
.assignment-page{color:var(--text)}
.assignment-header{border-bottom:1px solid var(--border);padding-bottom:1rem}.assignment-back{display:grid;width:2.25rem;height:2.25rem;place-items:center;border:1px solid var(--border);color:var(--text-muted)}.assignment-back:hover{border-color:var(--brand);color:var(--brand)}.assignment-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-top:.8rem}.assignment-eyebrow{color:var(--brand);font-size:.68rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.assignment-heading h1{margin-top:.2rem;font-size:1.85rem;line-height:1.15;font-weight:900}.assignment-heading>div>p:last-child{margin-top:.35rem;color:var(--text-muted);font-size:.85rem}.assignment-create{min-height:2.55rem!important;padding:.55rem .9rem!important;font-size:.82rem!important}
.assignment-alert{margin-top:1rem;border-left:3px solid;padding:.7rem .85rem;font-size:.8rem}.assignment-alert--success{border-color:#059669;background:#ecfdf5;color:#047857}.assignment-alert--error{border-color:#dc2626;background:#fef2f2;color:#b91c1c}
.grade-panel{margin-top:1.25rem;border:1px solid var(--border);background:var(--surface)}.grade-panel__heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--border);padding:.85rem 1rem}.grade-panel__heading h2{font-size:.95rem;font-weight:850}.grade-panel__heading p{margin-top:.15rem;color:var(--text-muted);font-size:.72rem}.grade-save{min-height:2.2rem!important;padding:.4rem .7rem!important;font-size:.75rem!important}.grade-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}.grade-fields>:not(:last-child){border-right:1px solid var(--border)}.grade-fields>:deep(div){padding:.7rem .8rem}.grade-fields :deep(input){min-height:2.25rem!important;border-radius:0!important;background:var(--surface-muted)!important}
.assignment-list-heading{display:flex;align-items:end;justify-content:space-between;margin-top:1.6rem;border-bottom:1px solid var(--border);padding-bottom:.65rem}.assignment-list-heading h2{font-size:1rem;font-weight:850}.assignment-list-heading p{margin-top:.1rem;color:var(--text-muted);font-size:.72rem}.assignment-list{border-top:1px solid var(--border)}.assignment-row{display:grid;grid-template-columns:minmax(18rem,1.4fr) minmax(24rem,1fr) auto;align-items:stretch;border:1px solid var(--border);border-top:0;background:var(--surface)}.assignment-row:hover{border-left-color:var(--brand);border-left-width:3px}.assignment-row__main{padding:1rem}.assignment-row__title-line{display:flex;align-items:center;gap:.65rem}.assignment-row__title-line strong{color:var(--brand);font-size:.72rem}.assignment-status{padding:.2rem .45rem;font-size:.65rem;font-weight:850}.assignment-status--published{background:#d1fae5;color:#047857}.assignment-status--draft{background:#fef3c7;color:#b45309}.assignment-row h3{margin-top:.55rem;font-size:1rem;line-height:1.35;font-weight:850}.assignment-row__main>p{display:-webkit-box;overflow:hidden;margin-top:.25rem;color:var(--text-muted);font-size:.75rem;line-height:1.45;-webkit-line-clamp:2;-webkit-box-orient:vertical}.assignment-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-left:1px solid var(--border)}.assignment-meta>div{display:flex;align-items:center;gap:.55rem;padding:.85rem;color:var(--text-muted)}.assignment-meta>div:not(:last-child){border-right:1px solid var(--border)}.assignment-meta dt{font-size:.65rem}.assignment-meta dd{margin-top:.15rem;color:var(--text);font-size:.72rem;font-weight:750}.assignment-actions{display:flex;align-items:stretch;border-left:1px solid var(--border)}.assignment-actions a,.assignment-actions button{display:flex;align-items:center;justify-content:center;gap:.35rem;border:0;border-left:1px solid var(--border);padding:0 .8rem;background:transparent;color:var(--text-muted);font-size:.72rem;font-weight:750;white-space:nowrap}.assignment-actions a{border-left:0;background:var(--brand);color:white}.assignment-actions a:hover{background:var(--brand-hover)}.assignment-actions button:hover{background:var(--surface-muted);color:var(--brand)}.assignment-actions .assignment-delete:hover{background:#fef2f2;color:#dc2626}.assignment-empty{display:grid;min-height:18rem;margin-top:1.25rem;place-items:center;align-content:center;border:1px dashed var(--border-strong);background:var(--surface);text-align:center;color:var(--text-muted)}.assignment-empty h2{margin-top:.75rem;color:var(--text);font-size:1rem;font-weight:850}.assignment-empty p{margin:.25rem 0 1rem;font-size:.75rem}.assignment-page :deep(button),.assignment-page :deep(input),.assignment-page :deep(textarea),.assignment-form :deep(button),.assignment-form :deep(input),.assignment-form :deep(textarea){border-radius:0!important}
@media(max-width:1280px){.assignment-row{grid-template-columns:1fr}.assignment-meta,.assignment-actions{border-top:1px solid var(--border);border-left:0}.assignment-actions a,.assignment-actions button{min-height:2.75rem;flex:1}}
@media(max-width:700px){.assignment-heading{align-items:stretch;flex-direction:column}.assignment-create{width:100%}.grade-panel__heading{align-items:stretch;flex-direction:column}.grade-fields{grid-template-columns:1fr}.grade-fields>:not(:last-child){border-right:0;border-bottom:1px solid var(--border)}.assignment-meta{grid-template-columns:1fr}.assignment-meta>div:not(:last-child){border-right:0;border-bottom:1px solid var(--border)}.assignment-actions{display:grid;grid-template-columns:1fr 1fr}.assignment-actions a{grid-column:1/-1}.assignment-actions button{border-top:1px solid var(--border)}.assignment-actions button span{display:none}}
</style>
