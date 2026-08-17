<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  from?: string
  to?: string
}>()

const emit = defineEmits<{
  change: [range: { from: string; to: string; groupBy?: 'day' | 'month' }]
}>()

const selectedPreset = ref<'7d' | '30d' | '365d' | 'custom'>('30d')
const customFrom = ref(props.from || getPresetDate(30))
const customTo = ref(props.to || getPresetDate(0))

function getPresetDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function selectPreset(preset: '7d' | '30d' | '365d') {
  selectedPreset.value = preset
  const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 364
  const from = getPresetDate(days)
  const to = getPresetDate(0)
  customFrom.value = from
  customTo.value = to
  emit('change', { from, to, groupBy: preset === '365d' ? 'month' : 'day' })
}

function applyCustom() {
  selectedPreset.value = 'custom'
  if (customFrom.value && customTo.value) {
    emit('change', { from: customFrom.value, to: customTo.value })
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      <button
        type="button"
        :class="[
          'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
          selectedPreset === '7d'
            ? 'bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        ]"
        @click="selectPreset('7d')"
      >
        7 ngày
      </button>
      <button
        type="button"
        :class="[
          'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
          selectedPreset === '30d'
            ? 'bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        ]"
        @click="selectPreset('30d')"
      >
        30 ngày
      </button>
      <button
        type="button"
        :class="[
          'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
          selectedPreset === '365d'
            ? 'bg-white text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        ]"
        @click="selectPreset('365d')"
      >
        1 năm
      </button>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="customFrom"
        type="date"
        class="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @change="applyCustom"
      />
      <span class="text-xs text-slate-400">đến</span>
      <input
        v-model="customTo"
        type="date"
        class="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        @change="applyCustom"
      />
    </div>
  </div>
</template>
