<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  autocomplete?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="space-y-2">
    <div v-if="label || $slots.label" class="flex items-center justify-between gap-3">
      <label :for="id" class="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="ml-0.5 text-red-500" aria-hidden="true">*</span>
      </label>
      <slot name="labelAction" />
    </div>
    <div class="relative">
      <div v-if="$slots.leading" class="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-slate-400">
        <slot name="leading" />
      </div>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error || hint ? `${id}-description` : undefined"
        :class="[
          'min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none',
          'placeholder:text-slate-400 hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10',
          'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none',
          'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-purple-500 dark:disabled:bg-slate-950',
          'transition-[border-color,box-shadow,background-color] duration-200',
          $slots.leading ? 'pl-11' : '',
          $slots.trailing ? 'pr-11' : '',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <div v-if="$slots.trailing" class="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400">
        <slot name="trailing" />
      </div>
    </div>
    <p v-if="error || hint" :id="`${id}-description`" :class="['text-xs leading-5', error ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400']">
      {{ error || hint }}
    </p>
  </div>
</template>
