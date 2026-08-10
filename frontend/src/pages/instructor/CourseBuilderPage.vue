<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useApi } from '@/composables/useApi'
import type { ApiResponse, CourseSection, Lesson } from '@/types'

const route=useRoute(),api=useApi(),courseId=String(route.params.courseId)
const sections=ref<CourseSection[]>([]),message=ref(''),error=ref(''),uploading=ref('')
async function load(){try{const r=await api.get<ApiResponse<CourseSection[]>>(`/courses/${courseId}/sections`);sections.value=r.data||[]}catch(e){error.value=e instanceof Error?e.message:'Không tải được nội dung'}}
async function createSection(){const title=prompt('Tên chương mới?')?.trim();if(!title)return;await api.post(`/courses/${courseId}/sections`,{title,position:sections.value.length+1});await load()}
async function editSection(s:CourseSection){const title=prompt('Tên chương',s.title)?.trim();if(!title)return;await api.patch(`/sections/${s.id}`,{title});await load()}
async function removeSection(s:CourseSection){if(!confirm(`Xóa chương “${s.title}” và toàn bộ bài học?`))return;await api.del(`/sections/${s.id}`);await load()}
async function createLesson(s:CourseSection){const title=prompt('Tên bài học?')?.trim();if(!title)return;const lessonType=(prompt('Loại bài: VIDEO, TEXT hoặc DOCUMENT','TEXT')||'TEXT').toUpperCase();if(!['VIDEO','TEXT','DOCUMENT'].includes(lessonType)){error.value='Loại bài không hợp lệ';return}await api.post(`/sections/${s.id}/lessons`,{title,lessonType,position:s.lessons.length+1,isPublished:false});await load()}
async function editLesson(l:Lesson){const title=prompt('Tên bài học',l.title)?.trim();if(!title)return;const content=prompt('Nội dung/URL (để trống nếu dùng upload)',l.content||'');await api.patch(`/lessons/${l.id}`,{title,content:content?.trim()||null});await load()}
async function toggleLesson(l:Lesson){await api.patch(`/lessons/${l.id}`,{isPublished:!l.isPublished});await load()}
async function removeLesson(l:Lesson){if(!confirm(`Xóa bài “${l.title}”?`))return;await api.del(`/lessons/${l.id}`);await load()}
async function upload(l:Lesson,event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;uploading.value=l.id;try{const body=new FormData();body.append('file',file);await api.post(`/lessons/${l.id}/file`,body);message.value='Upload thành công';await load()}catch(e){error.value=e instanceof Error?e.message:'Upload thất bại'}finally{uploading.value='';(event.target as HTMLInputElement).value=''}}
onMounted(load)
</script>

<template><InstructorLayout><div class="max-w-5xl space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-3"><div><RouterLink to="/instructor/courses" class="text-sm text-purple-600">← Khóa học của tôi</RouterLink><h1 class="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">Course builder</h1><p class="text-slate-500">Tạo chương, bài học, upload tài liệu và quiz.</p></div><BaseButton @click="createSection">+ Thêm chương</BaseButton></div>
  <p v-if="error" class="rounded-xl bg-red-50 p-3 text-red-700">{{ error }}</p><p v-if="message" class="rounded-xl bg-emerald-50 p-3 text-emerald-700">{{ message }}</p>
  <div v-if="api.loading&&!sections.length" class="py-12 text-center text-slate-500">Đang tải...</div>
  <div v-else-if="!sections.length" class="rounded-2xl border border-dashed p-12 text-center text-slate-500">Chưa có chương nào.</div>
  <section v-for="section in sections" :key="section.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <header class="flex items-center justify-between gap-3 bg-slate-50 p-4 dark:bg-slate-800"><h2 class="font-bold">Chương {{ section.position }}: {{ section.title }}</h2><div class="flex gap-2"><button class="text-sm text-purple-600" @click="editSection(section)">Sửa</button><button class="text-sm text-red-600" @click="removeSection(section)">Xóa</button><BaseButton size="sm" @click="createLesson(section)">+ Bài học</BaseButton></div></header>
    <div class="divide-y divide-slate-100 dark:divide-slate-800"><div v-for="lesson in section.lessons" :key="lesson.id" class="flex flex-wrap items-center gap-3 p-4"><span class="rounded-lg bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">{{ lesson.lessonType }}</span><div class="min-w-48 flex-1"><p class="font-semibold">{{ lesson.position }}. {{ lesson.title }}</p><p class="text-xs" :class="lesson.isPublished?'text-emerald-600':'text-amber-600'">{{ lesson.isPublished?'Đã xuất bản':'Bản nháp' }}</p></div><label class="cursor-pointer text-sm text-blue-600"><input class="hidden" type="file" :disabled="uploading===lesson.id" @change="upload(lesson,$event)">{{ uploading===lesson.id?'Đang tải...':'Upload file' }}</label><RouterLink class="text-sm text-purple-600" :to="`/instructor/lessons/${lesson.id}/quiz${lesson.quiz?`?quizId=${lesson.quiz.id}`:''}`">Quiz</RouterLink><button class="text-sm" @click="editLesson(lesson)">Sửa</button><button class="text-sm text-emerald-600" @click="toggleLesson(lesson)">{{ lesson.isPublished?'Ẩn':'Xuất bản' }}</button><button class="text-sm text-red-600" @click="removeLesson(lesson)">Xóa</button></div><p v-if="!section.lessons.length" class="p-5 text-sm text-slate-500">Chương này chưa có bài học.</p></div>
  </section>
</div></InstructorLayout></template>
