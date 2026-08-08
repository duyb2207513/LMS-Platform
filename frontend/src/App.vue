<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()

onMounted(() => {
  auth.initialize()
  theme.initialize()
})
</script>

<template>
  <router-view />
</template>
