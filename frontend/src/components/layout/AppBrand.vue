<script setup lang="ts">
import { computed } from 'vue'
import brandIcon from '@/assets/lms-learning-logo.png'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(defineProps<{
  compact?: boolean
  iconSize?: 'sm' | 'md' | 'lg'
  to?: string
}>(), {
  compact: false,
  iconSize: 'md',
  to: '',
})

const auth = useAuthStore()

const homePath = computed(() => {
  if (props.to) return props.to
  if (!auth.isLoggedIn) return '/'
  if (auth.isAdmin) return '/admin'
  if (auth.isInstructor) return '/instructor'
  if (auth.isStudent) return '/dashboard'
  return '/'
})
</script>

<template>
  <RouterLink :to="homePath" class="group inline-flex min-w-0 items-center gap-2.5" aria-label="LMS Platform">
    <span
      :class="[
        'grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-md transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105',
        iconSize === 'sm' ? 'h-8 w-8' : '',
        iconSize === 'md' ? 'h-10 w-10' : '',
        iconSize === 'lg' ? 'h-12 w-12 rounded-2xl' : '',
      ]"
    >
      <img :src="brandIcon" alt="LMS Logo" class="h-full w-full object-contain" />
    </span>
    <span v-if="!compact" class="max-[359px]:hidden truncate whitespace-nowrap text-lg font-black tracking-tight text-white sm:text-xl">
      LMS Platform
    </span>
  </RouterLink>
</template>
