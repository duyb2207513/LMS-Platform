<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  modelValue: 0,
  readonly: false,
  size: 'md',
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>

<template>
  <div class="inline-flex items-center gap-1" role="radiogroup" aria-label="Đánh giá sao">
    <component
      :is="readonly ? 'span' : 'button'"
      v-for="value in 5"
      :key="value"
      v-bind="readonly ? {} : { type: 'button', role: 'radio', 'aria-checked': value === modelValue, 'aria-label': `${value} sao` }"
      :class="[
        'star-rating__item transition-transform',
        readonly ? '' : 'cursor-pointer hover:-translate-y-0.5',
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-9 w-9' : 'h-5 w-5',
        value <= props.modelValue ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700',
      ]"
      @click="!readonly && emit('update:modelValue', value)"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2.7 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.9l-5.56 2.92 1.06-6.2L3 9.23l6.22-.9L12 2.7Z" />
      </svg>
    </component>
  </div>
</template>

<style scoped>
.star-rating__item { display: inline-grid; place-items: center; padding: 0; border: 0; background: transparent; }
.star-rating__item svg { width: 100%; height: 100%; }
</style>
