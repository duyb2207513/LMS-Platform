<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  closeOnBackdrop?: boolean
}>(), {
  size: 'md',
  closeOnBackdrop: true,
})

const emit = defineEmits<{ close: [] }>()

function close() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) close()
}

watch(() => props.show, (show) => {
  document.body.style.overflow = show ? 'hidden' : ''
  if (show) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 sm:p-6" role="presentation">
        <button
          type="button"
          class="absolute inset-0 h-full w-full cursor-default bg-slate-950/55 backdrop-blur-[3px]"
          aria-label="Đóng hộp thoại"
          @click="closeOnBackdrop && close()"
        />
        <section
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
          :class="[
            'relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/50 sm:max-h-[calc(100vh-3rem)]',
            size === 'sm' ? 'max-w-md' : '',
            size === 'md' ? 'max-w-lg' : '',
            size === 'lg' ? 'max-w-2xl' : '',
          ]"
        >
          <header v-if="title || $slots.header" class="flex shrink-0 items-start justify-between gap-5 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
            <slot name="header">
              <div>
                <h2 id="modal-title" class="text-lg font-bold tracking-tight text-slate-950 dark:text-white">{{ title }}</h2>
                <p v-if="description" class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ description }}</p>
              </div>
            </slot>
            <button
              type="button"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/15 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Đóng"
              @click="close"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30 sm:px-6">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active { transition: opacity 180ms ease; }
.modal-enter-active section,
.modal-leave-active section { transition: transform 180ms ease, opacity 180ms ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from section,
.modal-leave-to section { transform: translateY(12px) scale(.98); opacity: 0; }
</style>
