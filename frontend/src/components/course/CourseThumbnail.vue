<script setup lang="ts">
withDefaults(defineProps<{
  src?: string | null
  alt: string
  compact?: boolean
}>(), {
  src: null,
  compact: false,
})
</script>

<template>
  <div class="course-thumbnail" :class="{ 'course-thumbnail--compact': compact }">
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
    <div v-else class="course-thumbnail__placeholder" role="img" :aria-label="`Ảnh minh họa cho ${alt}`">
      <span class="course-thumbnail__grid" aria-hidden="true" />
      <span class="course-thumbnail__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
          <path stroke-linecap="round" stroke-width="1.7" d="M8 7h8M8 11h6" />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
.course-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  background: #ede9fe;
}

.course-thumbnail--compact { border-radius: 1rem; }

.course-thumbnail__placeholder {
  position: relative;
  display: grid;
  height: 100%;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 10%, rgba(255,255,255,.9), transparent 30%),
    linear-gradient(135deg, #ede9fe 0%, #f5d0fe 52%, #ddd6fe 100%);
}

.course-thumbnail__grid {
  position: absolute;
  inset: 0;
  opacity: .32;
  background-image: linear-gradient(rgba(124,58,237,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.13) 1px, transparent 1px);
  background-size: 26px 26px;
  transform: perspective(420px) rotateX(58deg) scale(1.35) translateY(24%);
}

.course-thumbnail__icon {
  position: relative;
  display: grid;
  width: 4.25rem;
  height: 4.25rem;
  place-items: center;
  border: 1px solid rgba(255,255,255,.78);
  border-radius: 1.35rem;
  background: rgba(255,255,255,.72);
  color: #7c3aed;
  box-shadow: 0 16px 38px rgba(91,33,182,.18);
  backdrop-filter: blur(8px);
}

.course-thumbnail__icon svg { width: 2rem; height: 2rem; }

:global(.dark) .course-thumbnail__placeholder {
  background: radial-gradient(circle at 18% 10%, rgba(168,85,247,.24), transparent 32%), linear-gradient(135deg, #24133c, #3b185f 55%, #1e1b4b);
}
:global(.dark) .course-thumbnail__icon { background: rgba(15,23,42,.72); border-color: rgba(255,255,255,.12); color: #d8b4fe; }
</style>
