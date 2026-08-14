<script setup lang="ts">
withDefaults(defineProps<{ modelValue?:string;label?:string;placeholder?:string;hint?:string;error?:string;required?:boolean;disabled?:boolean;rows?:number;id?:string }>(), { modelValue:'', required:false, disabled:false, rows:5 })
defineEmits<{ 'update:modelValue':[value:string] }>()
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-slate-700 dark:text-slate-200">{{ label }}<span v-if="required" class="ml-0.5 text-red-500">*</span></label>
    <textarea :id="id" :value="modelValue" :rows="rows" :placeholder="placeholder" :required="required" :disabled="disabled" :aria-invalid="Boolean(error)" :class="['w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100',error?'border-red-400':'border-slate-200 dark:border-slate-700']" @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" />
    <p v-if="error || hint" :class="['text-xs leading-5',error?'text-red-600':'text-slate-500']">{{ error || hint }}</p>
  </div>
</template>
