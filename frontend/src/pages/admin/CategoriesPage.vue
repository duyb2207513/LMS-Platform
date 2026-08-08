<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCategoryStore } from '@/stores/categories'
import type { Category } from '@/types'

const categoryStore = useCategoryStore()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const deletingCategory = ref<Category | null>(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')

const form = ref({ name: '', description: '' })

function openCreate() {
  isEditing.value = false
  editingId.value = ''
  form.value = { name: '', description: '' }
  formError.value = ''
  showModal.value = true
}

function openEdit(cat: Category) {
  isEditing.value = true
  editingId.value = cat.id
  form.value = { name: cat.name, description: cat.description || '' }
  formError.value = ''
  showModal.value = true
}

function openDelete(cat: Category) {
  deletingCategory.value = cat
  showDeleteConfirm.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    formError.value = 'Tên danh mục không được để trống'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    if (isEditing.value) {
      await categoryStore.updateCategory(editingId.value, form.value)
    } else {
      await categoryStore.createCategory(form.value)
    }
    showModal.value = false
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Lỗi khi lưu'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!deletingCategory.value) return
  deleting.value = true
  try {
    await categoryStore.deleteCategory(deletingCategory.value.id)
    showDeleteConfirm.value = false
    deletingCategory.value = null
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Lỗi khi xóa'
  } finally {
    deleting.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN')
}

onMounted(() => {
  categoryStore.fetchCategories()
})
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">Quản lý danh mục</h1>
          <p class="mt-2 text-slate-500 dark:text-slate-400">Tạo và quản lý danh mục khóa học</p>
        </div>
        <BaseButton @click="openCreate">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Thêm danh mục
        </BaseButton>
      </div>

      <LoadingSpinner v-if="categoryStore.loading" />

      <div v-else-if="categoryStore.categories.length === 0" class="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <svg class="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
        <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300">Chưa có danh mục nào</h3>
        <p class="text-slate-500 dark:text-slate-400 mt-2 mb-6">Tạo danh mục đầu tiên</p>
        <BaseButton @click="openCreate">Tạo danh mục</BaseButton>
      </div>

      <div v-else class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100 dark:border-slate-800">
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên</th>
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Mô tả</th>
              <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Ngày tạo</th>
              <th class="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categoryStore.categories" :key="cat.id" class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {{ cat.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ cat.name }}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500">{{ cat.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                {{ cat.description || '—' }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                {{ formatDate(cat.createdAt) }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(cat)" class="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer" title="Sửa">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="openDelete(cat)" class="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer" title="Xóa">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal :show="showModal" :title="isEditing ? 'Sửa danh mục' : 'Thêm danh mục'" @close="showModal = false">
      <form @submit.prevent="handleSave" class="space-y-5">
        <div v-if="formError" class="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 text-sm text-red-600 dark:text-red-400">{{ formError }}</div>
        <BaseInput id="cat-name" v-model="form.name" label="Tên danh mục" placeholder="VD: Lập trình web" :required="true" />
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
          <textarea v-model="form.description" rows="3" placeholder="Mô tả ngắn..." class="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none resize-none transition-colors duration-200" />
        </div>
        <div class="flex justify-end gap-3">
          <BaseButton variant="secondary" @click="showModal = false">Hủy</BaseButton>
          <BaseButton type="submit" :loading="saving">{{ isEditing ? 'Cập nhật' : 'Tạo mới' }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal :show="showDeleteConfirm" title="Xác nhận xóa" size="sm" @close="showDeleteConfirm = false">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Bạn có chắc muốn xóa danh mục <strong>{{ deletingCategory?.name }}</strong>? Hành động này không thể hoàn tác.
      </p>
      <div class="flex justify-end gap-3 mt-6">
        <BaseButton variant="secondary" @click="showDeleteConfirm = false">Hủy</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="handleDelete">Xóa</BaseButton>
      </div>
    </BaseModal>
  </AdminLayout>
</template>
